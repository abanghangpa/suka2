import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { checker } from './src/lib/checker';
import { loadSettings, loadStatuses } from './src/lib/db';
import { statusStore } from './src/lib/store';
import type { Channel, Playlist } from './src/lib/types';
import { ChannelsScreen } from './src/screens/ChannelsScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { PlaylistsScreen } from './src/screens/PlaylistsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { color } from './src/theme';

type Route =
  | { name: 'playlists' }
  | { name: 'channels'; playlist: Playlist }
  | { name: 'player'; list: Channel[]; index: number }
  | { name: 'settings' };

export default function App() {
  const [ready, setReady] = useState(false);
  // A tiny stack navigator: screens underneath stay mounted, so the channel list
  // keeps its filters, scroll position and scan state while you watch.
  const [stack, setStack] = useState<Route[]>([{ name: 'playlists' }]);
  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  useEffect(() => {
    (async () => {
      const [settings, statuses] = await Promise.all([loadSettings(), loadStatuses()]);
      checker.setSettings(settings);
      statusStore.load(statuses);
      setReady(true);
    })();
  }, []);

  // Don't check channels in the background; save results when leaving the app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checker.resume('background');
      else {
        checker.pause('background');
        void checker.flush();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  const render = (route: Route) => {
    switch (route.name) {
      case 'playlists':
        return <PlaylistsScreen onOpen={(playlist) => push({ name: 'channels', playlist })} onSettings={() => push({ name: 'settings' })} />;
      case 'channels':
        return (
          <ChannelsScreen
            playlist={route.playlist}
            onBack={pop}
            onPlay={(list, index) => push({ name: 'player', list, index })}
            onSettings={() => push({ name: 'settings' })}
          />
        );
      case 'player':
        return <PlayerScreen list={route.list} startIndex={route.index} onClose={pop} />;
      case 'settings':
        return <SettingsScreen onBack={pop} />;
    }
  };

  const top = stack[stack.length - 1];
  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden={top.name === 'player'} />
      <SafeAreaView style={styles.root} edges={top.name === 'player' ? [] : ['top', 'bottom']}>
        {ready
          ? stack.map((route, i) => (
              <View key={i} style={[StyleSheet.absoluteFill, i !== stack.length - 1 && styles.hidden]}>
                {render(route)}
              </View>
            ))
          : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  hidden: { display: 'none' },
});

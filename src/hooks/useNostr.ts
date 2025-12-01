
import { useState, useEffect } from 'react';
import { SimplePool, Event, Filter, nip19 } from 'nostr-tools';

export interface NostrPost {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
}

export function useNostr(pubkey: string) {
  const [posts, setPosts] = useState<NostrPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pubkey) return;

    const pool = new SimplePool();
    const relays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.snort.social',
      'wss://relay.nostr.band',
    ];

    async function fetchPosts() {
      try {
        setLoading(true);
        setError(null);

        // npub形式をhex形式に変換
        let hexPubkey: string;
        if (pubkey.startsWith('npub')) {
          const decoded = nip19.decode(pubkey);
          hexPubkey = decoded.data as string;
        } else {
          hexPubkey = pubkey;
        }
        
        const filter: Filter = {
          authors: [hexPubkey],
          kinds: [1], // text notes
          limit: 10,
        };

        const events = await pool.querySync(relays, filter);

        const validEvents = events.filter((event: Event | null): event is Event => event !== null);

        const sortedEvents = validEvents.sort((a: Event, b: Event) => b.created_at - a.created_at);

        const nostrPosts: NostrPost[] = sortedEvents.map((event: Event) => ({
          id: event.id,
          content: event.content,
          created_at: event.created_at,
          pubkey: event.pubkey,
        }));

        setPosts(nostrPosts);
      } catch (err) {
        console.error('Nostr fetch error:', err);
        setError(`Failed to fetch Nostr posts: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
        pool.close(relays);
      }
    }

    fetchPosts();
  }, [pubkey]);

  return { posts, loading, error };
}
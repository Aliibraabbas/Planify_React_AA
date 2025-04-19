import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/sypabase'; 


interface Event {
  id: string;                                     
  title: string;
  description?: string;
  proposed_dates: string[];
  owner_id: string;
  created_at?: string;

  owner_name?: string | null;
}

type VoteCountMap = Record<string, Record<string, number>>;


export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCountMap>({});
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});
  const [isCreate, setIsCreate] = useState(false);

  /* création d’événement */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateOptions, setDateOptions] = useState<string[]>(['', '']);
  const [selected, setSelected]= useState<Event | null>(null);

  const loadCurrentUserVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data, error } = await supabase
      .from('votes')
      .select('event_id, selected_dates')
      .eq('user_id', user.id);
  
    if (error) { console.error(error); return; }
  
    const map: Record<string, string[]> = {};
    data.forEach(v => { map[v.event_id] = v.selected_dates ?? []; });
    setUserVotes(map);
  };

  /** recharge toutes les voix d'un événement et met à jour voteCounts */

  const refreshEventVotes = async (eventId: string) => {
    const { data, error } = await supabase
      .from('votes')
      .select('selected_dates')
      .eq('event_id', eventId);
  
    if (error) { console.error(error); return; }
  
    const counts: Record<string, number> = {};
  
    data?.forEach(v => {
      (v.selected_dates ?? []).forEach((d: string) => {
        counts[d] = (counts[d] ?? 0) + 1;
      });
    });
  
    setVoteCounts(prev => ({ ...prev, [eventId]: counts }));
  };
  


  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    setEvents(data);
    data.forEach(ev => refreshEventVotes(ev.id));  
  };

  const addEvent = async () => {
    const clean = dateOptions.filter(d => d.trim());
    if (!title.trim() || clean.length < 2) return Alert.alert('Minimum requis', 'Vous devez proposer au moins 2 dates.');
    if (clean.length > 5) return Alert.alert('Limite atteinte', 'Vous pouvez proposer jusqu’à 5 dates maximum.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Erreur', 'Non connecté');

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description.trim(),
        proposed_dates: clean,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) { console.error(error); return; }

    setEvents(prev => [data, ...prev]);
    setTitle(''); setDescription(''); setDateOptions(['', '']); setIsCreate(false);
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setVoteCounts(prev => { const { [id]: _, ...rest } = prev; return rest; });
  };

  /* Vote */

  const vote = async (eventId: string, date: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    /* tableau actuel ou [] si aucun vote */
    const current = userVotes[eventId] ?? [];
    const alreadySelected = current.includes(date);
  
    /* on ajoute ou on retire la date */
    const newSelection = alreadySelected
      ? current.filter(d => d !== date)           
      : [...current, date];                        
  
    /* insert ou update */
    await supabase.from('votes').upsert({
      user_id: user.id,
      event_id: eventId,
      selected_dates: newSelection,
    }, { onConflict: 'user_id,event_id' });       
  
    /* met à jour le cache local */
    setUserVotes(p => ({ ...p, [eventId]: newSelection }));
  
   
    await refreshEventVotes(eventId);
  };

  
  useEffect(() => { 
    fetchEvents(); 
    loadCurrentUserVotes(); 
  }, []);

const displayOptions = (ev: Event) => {
  const counts = voteCounts[ev.id] ?? {};
  const maxVotes =
    Object.values(counts).length > 0 ? Math.max(...Object.values(counts)) : 0;

  return ev.proposed_dates.length ? (
    ev.proposed_dates.map((d, i) => {
      const isWinner = (counts[d] ?? 0) === maxVotes && maxVotes > 0;

      return (
        <TouchableOpacity
          key={i}
          style={[styles.voteButton, isWinner && styles.winner]}
          onPress={() => vote(ev.id, d)}
        >
          <Text style={isWinner && styles.winnerText}>
            {`${d} (${counts[d] ?? 0})`}
          </Text>
        </TouchableOpacity>
      );
    })
  ) : (
    <Text>Aucune date</Text>
  );
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Événements</Text>

      <FlatList
        data={events}
        keyExtractor={e => e.id}
        ListEmptyComponent={<Text>Aucun événement</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.eventCard} onPress={() => setSelected(item)}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
            </View>
            <TouchableOpacity onPress={() =>
              Alert.alert(
                'Supprimer', 
                'Êtes-vous sûr de vouloir supprimer cet événement ?', 
                [
                { text: 'Cancel' },
                { text: 'Suprimer', style: 'destructive', onPress: () => deleteEvent(item.id) },
              ]
              )}>
              <Text style={styles.removeText}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Modal création d'événement */}
      <Modal visible={isCreate} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>🎉 Nouveau Événement</Text>

              <TextInput 
                style={styles.input} 
                placeholder="Titre" 
                value={title} 
                onChangeText={setTitle} 
              />

              <TextInput
                style={styles.input} 
                placeholder="Description" 
                value={description} 
                onChangeText={setDescription} 
               />

              <Text style={styles.label}>Proposez 2 à 5 dates :</Text>
              {dateOptions.map((opt, i) => (
                <View key={i} style={styles.dateRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={`Date/Heure ${i + 1}`}
                    value={opt}
                    onChangeText={v => setDateOptions(arr => arr.map((o, idx) => idx === i ? v : o))}
                  />
                  {dateOptions.length > 2 && (
                    <TouchableOpacity onPress={() => setDateOptions(arr => arr.filter((_, idx) => idx !== i))}>
                      <Text style={styles.removeText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {dateOptions.length < 5 && (
                <TouchableOpacity style={styles.addDateButton} onPress={() => setDateOptions(arr => [...arr, ''])}>
                  <Text style={styles.addDateText}>➕ Ajouter</Text>
                </TouchableOpacity>
              )}

              <Button title="Créer l'événement" onPress={addEvent} />
              <Button title="Annuler" color="red" onPress={() => setIsCreate(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal voter sur un événement */}
      <Modal visible={!!selected} transparent animationType="slide">
        {selected && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🗳️ Voter pour : {selected.title}</Text>

              {/* <Text style={styles.creatorText}>
                Créé par : 
              </Text> */}

              {selected.description && <Text style={styles.eventDescription}>{selected.description}</Text>}
              {displayOptions(selected)}

              <TouchableOpacity style={styles.shareButton} onPress={() => Share.share({ message: selected.title })}>
                <Text style={styles.shareText}>🔗 Partager</Text>
              </TouchableOpacity>
              <Button title="Fermer" onPress={() => setSelected(null)} />
            </View>
          </View>
        )}
      </Modal>

    {/* Bouton "Créer un événement" */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsCreate(true)}>
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#f2f2f2' 
  },

  title:{
    fontSize: 26, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 20 
  },

  eventCard:{ 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10 
  },

  eventInfo:{ 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },

  eventTitle:{ 
    fontSize: 16, 
    fontWeight: '600' 
  },

  eventDescription:{ 
    fontSize: 14, 
    color: '#555' 
  },

  removeText:{ 
    fontSize: 20, 
    color: 'red' 
  },

  modalContainer:{ 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },

  modalContent:{ 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    maxHeight: '90%' 
  },

  modalTitle:{ 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 10 
  },

  creatorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },

  input:{ 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10 
  },

  label:{ 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 5 
  },

  dateRow:{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },

  addDateButton:{
     backgroundColor: '#4CAF50', 
     padding: 10, 
     borderRadius: 8, 
     alignItems: 'center', 
     marginBottom: 20 
    },

  addDateText:{ 
    color: '#fff', 
    fontWeight: '600' 
  },

  voteButton:{ 
    backgroundColor: '#eee', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10, 
    alignItems: 'center'
   },

  shareButton:{ 
    backgroundColor: '#4CAF50', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },

  shareText:{ 
    color: '#fff', 
    fontWeight: '600' 
  },

  fab:{ 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    backgroundColor: '#4CAF50', 
    borderRadius: 30,
    width: 60, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 10 
  },

  fabText:{ 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: '700' 
  },

  winner: {
    backgroundColor: '#c8ffc8',   // bouton gagnant
  },
  winnerText: {
    fontWeight: '700',            // texte en gras
  },

});

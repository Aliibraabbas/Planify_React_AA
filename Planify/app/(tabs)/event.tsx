import React, { useState } from 'react';
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
} from 'react-native';

interface Event {
  id: string;
  name: string;
  date: string;
  votes: {
    yes: number;
    no: number;
  };
}

export default function CreateEventScreen() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fonction pour générer un ID unique simple
  const generateEventId = () => {
    return `event-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addEvent = () => {
    const name = eventName.trim();
    const date = eventDate.trim();

    if (!name || !date) {
      Alert.alert('Infos manquantes', 'Merci de remplir le nom et la date de l’événement.');
      return;
    }

    const newEvent: Event = {
      id: generateEventId(),  // Utilisation de la méthode simple pour générer un ID unique
      name,
      date,
      votes: {
        yes: 0,
        no: 0,
      },
    };

    setEvents(prev => [...prev, newEvent]);
    setEventName('');
    setEventDate('');
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const vote = (type: 'yes' | 'no') => {
    if (!selectedEvent) return;

    setEvents(prev =>
      prev.map(ev =>
        ev.id === selectedEvent.id
          ? {
              ...ev,
              votes: {
                ...ev.votes,
                [type]: ev.votes[type] + 1,
              },
            }
          : ev
      )
    );

    setSelectedEvent(null);
  };

  // Fonction pour partager un événement
  const shareEvent = async (event: Event) => {
    try {
      const result = await Share.share({
        message: `Événement: ${event.name}\nDate: ${event.date}\nParticipez à l'événement en votant pour la date !`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Partagé via :', result.activityType);
        } else {
          console.log('Événement partagé avec succès');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Partage annulé');
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un événement 🎉</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom de l’événement"
        value={eventName}
        onChangeText={setEventName}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (ex: 20/04/2025)"
        value={eventDate}
        onChangeText={setEventDate}
      />
      <Button title="Ajouter" onPress={addEvent} />

      <Text style={styles.subtitle}>📌 Événements proposés :</Text>

      {events.length === 0 ? (
        <Text style={styles.empty}>Aucun événement pour le moment</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedEvent(item)}>
                <Text style={styles.eventName}>{item.name}</Text>
                <Text style={styles.eventDate}>📅 {item.date}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteEvent(item.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal de vote */}
      <Modal visible={selectedEvent !== null} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗳️ Vote pour : {selectedEvent?.name}</Text>
            <Text style={styles.modalDate}>📅 {selectedEvent?.date}</Text>

            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[styles.voteButton, { backgroundColor: '#b6e3b6' }]}
                onPress={() => vote('yes')}
              >
                <Text>✅ Oui ({selectedEvent?.votes.yes})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voteButton, { backgroundColor: '#f5b6b6' }]}
                onPress={() => vote('no')}
              >
                <Text>❌ Non ({selectedEvent?.votes.no})</Text>
              </TouchableOpacity>
            </View>

            {/* Ajouter le bouton de partage */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => selectedEvent && shareEvent(selectedEvent)}
            >
              <Text style={styles.shareText}>🔗 Partager l'événement</Text>
            </TouchableOpacity>

            <Button title="Fermer" onPress={() => setSelectedEvent(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f2f2f2',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  empty: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 10,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  deleteText: {
    fontSize: 18,
    color: '#cc0000',
    paddingLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 16,
    marginBottom: 20,
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  voteButton: {
    padding: 12,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  shareText: {
    color: 'white',
    fontWeight: '600',
  },
});

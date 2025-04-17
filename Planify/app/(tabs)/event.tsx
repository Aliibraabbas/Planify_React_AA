import React, { useState } from 'react';
import { Dimensions } from 'react-native';

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

interface Event {
  id: string;
  title: string;
  description?: string;
  options: string[];
  votes: {
    [option: string]: number;
  };
}

interface UserVote {
  [eventId: string]: string | null; // Keep track of the user's vote for each event (null if no vote)
}

export default function CreateEventScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote>({});
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateOptions, setDateOptions] = useState<string[]>(['', '']);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const generateEventId = () => {
    return `event-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addEvent = () => {
    const cleanOptions = dateOptions.filter(opt => opt.trim() !== '');

    if (!title.trim() || cleanOptions.length < 2) {
      Alert.alert('Erreur', 'Merci de remplir un titre et au moins 2 dates.');
      return;
    }

    if (cleanOptions.length > 5) {
      Alert.alert('Erreur', 'Vous pouvez proposer maximum 5 dates.');
      return;
    }

    const newEvent: Event = {
      id: generateEventId(),
      title: title.trim(),
      description: description.trim(),
      options: cleanOptions,
      votes: cleanOptions.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}),
    };

    setEvents(prev => [...prev, newEvent]);
    setTitle('');
    setDescription('');
    setDateOptions(['', '']);
    setIsCreateModalVisible(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const vote = (eventId: string, option: string) => {
    const currentUserVote = userVotes[eventId];

    // If the user already voted for this event
    if (currentUserVote) {
      if (currentUserVote === option) {
        // User wants to remove their vote by selecting the same option
        setEvents(prev =>
          prev.map(ev =>
            ev.id === eventId
              ? {
                  ...ev,
                  votes: {
                    ...ev.votes,
                    [option]: ev.votes[option] - 1, // Decrease the vote count
                  },
                }
              : ev
          )
        );
        setUserVotes(prev => ({
          ...prev,
          [eventId]: null, // Remove the vote for this event
        }));
      } else {
        // User wants to change their vote to a different option
        setEvents(prev =>
          prev.map(ev =>
            ev.id === eventId
              ? {
                  ...ev,
                  votes: {
                    ...ev.votes,
                    [currentUserVote]: ev.votes[currentUserVote] - 1, // Remove the previous vote
                    [option]: ev.votes[option] + 1, // Add the new vote
                  },
                }
              : ev
          )
        );
        setUserVotes(prev => ({
          ...prev,
          [eventId]: option, // Update the user's vote to the new option
        }));
      }
    } else {
      // User is voting for the first time
      setEvents(prev =>
        prev.map(ev =>
          ev.id === eventId
            ? {
                ...ev,
                votes: {
                  ...ev.votes,
                  [option]: ev.votes[option] + 1, // Add the vote
                },
              }
            : ev
        )
      );
      setUserVotes(prev => ({
        ...prev,
        [eventId]: option, // Store the user's vote
      }));
    }

    setSelectedEvent(null); // Close the modal after voting
  };

  const shareEvent = async (event: Event) => {
    try {
      await Share.share({
        message: `Événement : ${event.title}\n${event.description || ''}\nParticipez et votez !`,
      });
    } catch (error) {
      console.error('Erreur partage :', error);
    }
  };

  const updateDateOption = (index: number, value: string) => {
    const newOptions = [...dateOptions];
    newOptions[index] = value;
    setDateOptions(newOptions);
  };

  const addDateOption = () => {
    if (dateOptions.length < 5) {
      setDateOptions(prev => [...prev, '']);
    } else {
      Alert.alert('Limite atteinte', 'Vous pouvez proposer jusqu’à 5 dates maximum.');
    }
  };

  const removeDateOption = (index: number) => {
    if (dateOptions.length > 2) {
      const newOptions = [...dateOptions];
      newOptions.splice(index, 1);
      setDateOptions(newOptions);
    } else {
      Alert.alert('Minimum requis', 'Vous devez proposer au moins 2 dates.');
    }
  };

  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={styles.parent}>
      <View style={styles.container}>
        <Text style={styles.title}>Event :</Text>

        {events.length === 0 ? (
          <Text style={styles.empty}>Aucun événement pour le moment</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.eventCard} onPress={() => setSelectedEvent(item)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    {item.description ? <Text style={styles.eventDescription}>{item.description}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => {
                    Alert.alert(
                      'Supprimer',
                      'Êtes-vous sûr de vouloir supprimer cet événement ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Supprimer', style: 'destructive', onPress: () => deleteEvent(item.id) },
                      ],
                      { cancelable: true }
                    );
                  }}>
                    <Text style={styles.removeText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Modal création d'événement */}
        <Modal visible={isCreateModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>🎉 Nouveau Événement</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Titre de l’événement"
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description (facultatif)"
                  value={description}
                  onChangeText={setDescription}
                />

                <Text style={styles.label}>Proposez 2 à 5 dates :</Text>
                {dateOptions.map((option, index) => (
                  <View key={index} style={styles.dateOptionRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={`Date/Heure ${index + 1}`}
                      value={option}
                      onChangeText={value => updateDateOption(index, value)}
                    />
                    <TouchableOpacity onPress={() => removeDateOption(index)}>
                      <Text style={styles.removeText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addDateButton} onPress={addDateOption}>
                  <Text style={styles.addDateButtonText}>➕ Ajouter une date</Text>
                </TouchableOpacity>

                <Button title="Créer l'événement" onPress={addEvent} />
                <Button title="Annuler" color="red" onPress={() => setIsCreateModalVisible(false)} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal voter sur un événement */}
        <Modal visible={selectedEvent !== null} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            {selectedEvent && (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>🗳️ Voter pour : {selectedEvent.title}</Text>
                {selectedEvent.description && <Text style={styles.eventDescription}>{selectedEvent.description}</Text>}

                {selectedEvent.options.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.voteButton}
                    onPress={() => vote(selectedEvent.id, option)}
                  >
                    <Text>
                      {option} ({selectedEvent.votes[option]} votes)
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => selectedEvent && shareEvent(selectedEvent)}
                >
                  <Text style={styles.shareText}>🔗 Partager</Text>
                </TouchableOpacity>

                <Button
                  title="Supprimer l'événement"
                  color="red"
                  onPress={() => {
                    if (selectedEvent) {
                      Alert.alert(
                        'Supprimer',
                        'Êtes-vous sûr de vouloir supprimer cet événement ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: () => {
                              deleteEvent(selectedEvent.id);
                              setSelectedEvent(null);
                            },
                          },
                        ],
                        { cancelable: true }
                      );
                    }
                  }}
                />

                <Button title="Fermer" onPress={() => setSelectedEvent(null)} />
              </View>
            )}
          </View>
        </Modal>

        {/* Bouton "Créer un événement" */}
        <TouchableOpacity
          style={styles.floatingCreateButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Text style={styles.createButtonText}>➕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  parent: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingTop: 60,
    flex: 0.85,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 20,
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
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  floatingCreateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  dateOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeText: {
    fontSize: 20,
    color: 'red',
    marginLeft: 10,
  },
  addDateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addDateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  voteButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
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
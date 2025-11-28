import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function LifeCoachScreen({ navigation }: any) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Welcome message
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: "Hi! I'm your AI Life Coach. I've analyzed your patterns and I'm here to help you understand them better. What would you like to explore?",
                timestamp: new Date(),
            },
        ]);
    }, []);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date(),
        };

        setMessages([...messages, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('/api/life-coach/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ query: inputText }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const quickQuestions = [
        'Why do I keep changing careers?',
        'What patterns do you see in my relationships?',
        'How can I improve my productivity?',
        'What can I learn from my past?',
    ];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Life Coach AI</Text>
                    <Text style={styles.headerSubtitle}>Powered by your patterns</Text>
                </View>
                <Ionicons name="sparkles" size={24} color="#FFD700" />
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBubble,
                            message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                        ]}
                    >
                        {message.role === 'assistant' && (
                            <View style={styles.assistantIcon}>
                                <Ionicons name="sparkles" size={16} color="#FFD700" />
                            </View>
                        )}
                        <Text style={styles.messageText}>{message.content}</Text>
                    </View>
                ))}

                {loading && (
                    <View style={[styles.messageBubble, styles.assistantBubble]}>
                        <Text style={styles.messageText}>Analyzing...</Text>
                    </View>
                )}

                {messages.length === 1 && (
                    <View style={styles.quickQuestionsContainer}>
                        <Text style={styles.quickQuestionsTitle}>Try asking:</Text>
                        {quickQuestions.map((question, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickQuestionButton}
                                onPress={() => {
                                    setInputText(question);
                                    sendMessage();
                                }}
                            >
                                <Text style={styles.quickQuestionText}>{question}</Text>
                                <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask about your patterns..."
                    placeholderTextColor="#666"
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || loading}
                >
                    <Ionicons name="send" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.disclaimer}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.disclaimerText}>
                    AI suggestions are for informational purposes only, not professional advice
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#666',
        fontSize: 12,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    assistantIcon: {
        marginBottom: 4,
    },
    messageText: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 22,
    },
    quickQuestionsContainer: {
        marginTop: 20,
    },
    quickQuestionsTitle: {
        color: '#999',
        fontSize: 14,
        marginBottom: 12,
    },
    quickQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    quickQuestionText: {
        color: '#007AFF',
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    input: {
        flex: 1,
        backgroundColor: '#000',
        color: '#FFF',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#333',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1a1a1a',
    },
    disclaimerText: {
        color: '#666',
        fontSize: 11,
        marginLeft: 8,
        flex: 1,
    },
});

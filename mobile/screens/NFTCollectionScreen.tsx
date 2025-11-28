import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function NFTCollectionScreen({ navigation }: any) {
    const [nfts, setNfts] = useState<any[]>([]);
    const [collection, setCollection] = useState<any>(null);
    const [showMintModal, setShowMintModal] = useState(false);
    const [mintData, setMintData] = useState({ name: '', description: '', category: 'CAREER_HIGHLIGHT' });

    useEffect(() => {
        loadCollection();
    }, []);

    const loadCollection = async () => {
        const response = await axios.get('/api/celebrity/nft/collection');
        setCollection(response.data);
        setNfts(response.data.nfts || []);
    };

    const mintNFT = async () => {
        try {
            await axios.post('/api/celebrity/nft/mint', { ...mintData, imageUrl: 'placeholder.jpg' });
            setShowMintModal(false);
            loadCollection();
            Alert.alert('Success', 'NFT minted successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to mint NFT');
        }
    };

    const renderNFT = ({ item }: any) => (
        <TouchableOpacity style={styles.nftCard} onPress={() => navigation.navigate('NFTDetail', { nftId: item.id })}>
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} style={styles.nftImage} />
            <View style={styles.nftInfo}>
                <Text style={styles.nftName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.nftMeta}>
                    <Text style={styles.nftCategory}>{item.category}</Text>
                    {item.isListed && (
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>{item.listPrice} MATIC</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{collection?.collectionName || 'NFT Collection'}</Text>
                    <Text style={styles.headerStats}>
                        {collection?.totalMinted || 0} minted · Floor: {collection?.floorPrice || 0} MATIC
                    </Text>
                </View>
                <TouchableOpacity style={styles.mintButton} onPress={() => setShowMintModal(true)}>
                    <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={nfts}
                renderItem={renderNFT}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="diamond-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No NFTs minted yet</Text>
                        <TouchableOpacity style={styles.mintButton} onPress={() => setShowMintModal(true)}>
                            <Text style={styles.mintButtonText}>Mint Your First NFT</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Modal visible={showMintModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Mint Career Moment NFT</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="NFT Name"
                            value={mintData.name}
                            onChangeText={(text) => setMintData({ ...mintData, name: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            value={mintData.description}
                            onChangeText={(text) => setMintData({ ...mintData, description: text })}
                            multiline
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMintModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={mintNFT}>
                                <Text style={styles.confirmButtonText}>Mint NFT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    headerStats: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    mintButton: { backgroundColor: '#6366F1', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    grid: { padding: 16 },
    nftCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, margin: '1%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    nftImage: { width: '100%', height: 150, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    nftInfo: { padding: 12 },
    nftName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    nftMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    nftCategory: { fontSize: 12, color: '#6B7280' },
    priceBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    priceText: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginVertical: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    textArea: { height: 100, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
    confirmButton: { flex: 1, backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
    confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    mintButtonText: { color: '#6366F1', fontSize: 16, fontWeight: '600', marginTop: 16 },
});

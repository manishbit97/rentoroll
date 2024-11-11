import { TabBarMaterialIcon } from '@/components/navigation/TabBarIcon';
import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    SafeAreaView,
} from 'react-native';
interface Tab {
    id: number;
    name: string;
    img: string;
}

// Define the props for the FlatListToggleButton component
interface FlatListToggleButtonProps {
    tabs: Tab[];
    onTabClick: (id: number) => void;
}

export default function FlatListToggleButton({ tabs, onTabClick }: FlatListToggleButtonProps) {
    const [value, setValue] = React.useState(1);
    const handleTabClick = (id: number) => {
        setValue(id);
        onTabClick(id);
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container} id="containertoggle">
                {tabs.map((item, index) => {
                    const isActive = item.id === value;

                    return (
                        <View key={item.name} style={{ flex: 1 }}>
                            <Pressable
                                onPress={() => handleTabClick(item.id)}>
                                <View
                                    style={[
                                        styles.item,
                                        isActive && { backgroundColor: '#e5e7eb' },
                                    ]}>
                                    <TabBarMaterialIcon name={item.img} size={20} color={isActive ? '#374151' : '#6b7280'} style={styles.image} />
                                    <Text style={[styles.text, isActive && { color: '#374151' }]}>
                                        {item.name}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 0,
        marginHorizontal: 12,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    image: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    item: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'transparent',
        borderRadius: 6,
        flexDirection: 'row',
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        lineHeight: 22,
    },
});
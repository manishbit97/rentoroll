// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

export function TabBarMaterialIcon({ style, ...rest }: IconProps<ComponentProps<typeof MaterialCommunityIcons>['name']>) {
  return <MaterialCommunityIcons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

export function TabBarAntIcon({ style, ...rest }: IconProps<ComponentProps<typeof AntDesign>['name']>) {
  return <AntDesign size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
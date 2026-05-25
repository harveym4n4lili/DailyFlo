/**
 * Continue with email — opens the same recurrence-pill style menu as task quick-add:
 * ios: expo-ui SwiftUI Menu (native anchored menu).
 * android + web: DropdownList anchored bottom-left under the footer gutter.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Host, Menu } from '@expo/ui/swift-ui';

import { DropdownList } from '@/components/ui/List';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import {
  AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL,
  AUTH_EMAIL_LOGIN_OPTION_LABEL,
  AUTH_EMAIL_SIGN_UP_OPTION_LABEL,
} from '../constants/textValues';
import { AuthLandingGlassAuthRow } from './AuthLandingGlassAuthRow';

export type AuthEmailMethodMenuRowProps = {
  tintColor: string;
  labelColor: string;
  /** matches auth footer `paddingHorizontal` so android dropdown lines up with the glass row */
  dropdownLeftOffset: number;
};

const LOGIN_HREF = '/(onboarding)/auth/login' as const;
const REGISTER_HREF = '/(onboarding)/auth/register' as const;

export function AuthEmailMethodMenuRow({
  tintColor,
  labelColor,
  dropdownLeftOffset,
}: AuthEmailMethodMenuRowProps) {
  const router = useGuardedRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const openLogin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(LOGIN_HREF);
  }, [router]);

  const openRegister = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(REGISTER_HREF);
  }, [router]);

  const dropdownItems = useMemo(
    () => [
      { id: 'login', label: AUTH_EMAIL_LOGIN_OPTION_LABEL, onPress: openLogin },
      { id: 'register', label: AUTH_EMAIL_SIGN_UP_OPTION_LABEL, onPress: openRegister },
    ],
    [openLogin, openRegister],
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.menuWrap} collapsable={false}>
        <Host matchContents={false} style={styles.host}>
          <Menu
            label={
              <View style={styles.menuLabelTapArea}>
                {/* swiftui owns interaction — nested Pressable would fight Menu */}
                <AuthLandingGlassAuthRow
                  label={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
                  icon="mail-outline"
                  accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
                  tintColor={tintColor}
                  labelColor={labelColor}
                  interactive={false}
                />
              </View>
            }
          >
            <Button label={AUTH_EMAIL_LOGIN_OPTION_LABEL} onPress={openLogin} />
            <Button label={AUTH_EMAIL_SIGN_UP_OPTION_LABEL} onPress={openRegister} />
          </Menu>
        </Host>
      </View>
    );
  }

  return (
    <View collapsable={false}>
      <View>
        {/* android/web: tapping the pill opens anchored DropdownList — same rhythm as QuickAdd recurrence */}
        <AuthLandingGlassAuthRow
          label={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
          icon="mail-outline"
          accessibilityLabel={AUTH_LANDING_CONTINUE_WITH_EMAIL_LABEL}
          tintColor={tintColor}
          labelColor={labelColor}
          onPress={() => {
            Keyboard.dismiss();
            setMenuVisible(true);
          }}
        />
      </View>
      <DropdownList
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorPosition="bottom-left"
        leftOffset={dropdownLeftOffset}
        items={dropdownItems}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menuWrap: {
    alignSelf: 'stretch',
  },
  host: {
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  menuLabelTapArea: {
    width: '100%',
  },
});

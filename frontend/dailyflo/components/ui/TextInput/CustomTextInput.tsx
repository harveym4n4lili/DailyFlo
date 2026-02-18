/**
 * CustomTextInput Component
 * 
 * A custom iOS-style text input component with full control over:
 * - Cursor positioning and visibility
 * - Keyboard handling and scroll behavior
 * - Selection and styling
 * - Height management and expansion
 * 
 * This component provides better control than React Native's default TextInput
 * for complex text editing scenarios like task descriptions.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Dimensions,
  StyleSheet,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { useColorScheme } from 'react-native';

// import design system constants
import { ThemeColors, getTaskCategoryColor } from '@/constants/ColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

// import types
import type { TaskColor } from '@/types';

/**
 * Props interface for CustomTextInput component
 */
export interface CustomTextInputProps {
  /** Current text value */
  value?: string;
  /** Callback when text changes */
  onChangeText?: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is editable */
  editable?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Task color for styling the cursor */
  taskColor?: TaskColor;
  /** Whether this is a multiline input */
  multiline?: boolean;
  /** Custom style for the container */
  containerStyle?: any;
  /** Optional style merged with the visible text area (e.g. to override padding) */
  inputStyle?: any;
  /** Callback when input is focused */
  onFocus?: () => void;
  /** Callback when input is blurred */
  onBlur?: () => void;
}

/**
 * CustomTextInput Component
 * 
 * Renders a custom text input with iOS-like behavior and styling.
 * Provides better control over cursor visibility and keyboard handling.
 */
export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value = '',
  onChangeText,
  placeholder = '',
  editable = true,
  maxLength = 500,
  taskColor = 'blue',
  multiline = true,
  containerStyle,
  inputStyle,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}) => {
  // get current color scheme (light/dark mode)
  const colorScheme = useColorScheme() || 'dark';
  
  // local state for text and cursor management
  const [localText, setLocalText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [measuredTextWidth, setMeasuredTextWidth] = useState(0);
  
  // keyboard and screen management
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // refs for the hidden text input and scroll view
  const hiddenInputRef = useRef<RNTextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // refs for measuring text width accurately
  const textMeasureRef = useRef<Text>(null);
  
  // animated value for cursor blinking
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  
  // listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    
    // listen for screen dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });
    
    // cleanup listeners on component unmount
    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      subscription?.remove();
    };
  }, []);
  
  // sync local text with prop value
  useEffect(() => {
    setLocalText(value);
  }, [value]);
  
  // cursor blinking animation - iOS style
  useEffect(() => {
    let blinkAnimation: Animated.CompositeAnimation;
    
    if (isFocused) {
      // start blinking animation when focused
      blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500, // iOS-like timing
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
    } else {
      // stop blinking when not focused
      cursorOpacity.setValue(0);
    }
    
    return () => {
      if (blinkAnimation) {
        blinkAnimation.stop();
      }
    };
  }, [isFocused, cursorOpacity]);
  
  /**
   * Handle text changes from the hidden input
   */
  const handleTextChange = (text: string) => {
    setLocalText(text);
    onChangeText?.(text);
  };
  
  /**
   * Handle selection changes to track cursor position
   */
  const handleSelectionChange = (event: any) => {
    const { start } = event.nativeEvent.selection;
    setCursorPosition(start);
  };
  
  /**
   * Handle key press events for better multiline support
   */
  const handleKeyPress = (event: any) => {
    // Allow all key presses including Enter for new lines
    // This ensures proper multiline behavior
    if (event.nativeEvent.key === 'Enter' && multiline) {
      // Let the default behavior handle the new line
      return;
    }
  };
  
  /**
   * Handle focus events
   */
  const handleFocus = () => {
    setIsFocused(true);
    // focus the hidden input to show keyboard
    hiddenInputRef.current?.focus();
    // call parent onFocus callback if provided
    onFocusProp?.();
  };
  
  /**
   * Handle blur events
   * Only blur if the component is actually losing focus intentionally
   */
  const handleBlur = () => {
    // add a small delay to prevent accidental blur during tap
    setTimeout(() => {
      // only blur if the hidden input is actually not focused
      if (!hiddenInputRef.current?.isFocused()) {
        setIsFocused(false);
        // call parent onBlur callback if provided
        onBlurProp?.();
      }
    }, 50);
  };
  
  /**
   * Handle tap on the visible text area
   * Prevents keyboard from closing by maintaining focus
   */
  const handleTap = () => {
    if (editable) {
      // if already focused, don't refocus (prevents keyboard flicker)
      if (!isFocused) {
        handleFocus();
      } else {
        // if already focused, just ensure the hidden input stays focused
        hiddenInputRef.current?.focus();
      }
    }
  };
  
  // get theme colors
  const colors = ThemeColors[colorScheme];
  // use white for cursor/stylus - matches iOS-style caret
  const stylusColor = 'white';
  
  // safely split text into lines for rendering first
  // ensure localText is always a string to prevent undefined errors
  const safeText = localText || '';
  const lines = safeText.split('\n');
  
  // ensure we always have at least one line for proper rendering
  if (!lines || lines.length === 0) {
    lines.push('');
  }
  
  // calculate dynamic height based on content
  const lineHeight = 20; // matches our text style line height
  const minHeight = 40; // minimum height for the input
  const paddingVertical = 24; // top + bottom padding (12 + 12)
  
  // calculate content height based on number of lines (with safety check)
  const linesCount = lines?.length || 1;
  const contentHeight = Math.max(linesCount * lineHeight + paddingVertical, minHeight);
  
  // removed maxHeight constraint to allow infinite expansion
  // the parent ScrollView in TaskCreationContent will handle scrolling
  // this allows the description input to expand as much as needed
  const maxHeight = undefined; // no max height - allow infinite expansion
  
  // use content height directly without max height constraint
  // content can expand infinitely, parent ScrollView handles scrolling
  const finalHeight = contentHeight;
  
  // calculate cursor line and position within line for multiline support
  const textBeforeCursor = safeText.substring(0, cursorPosition);
  const linesBeforeCursor = textBeforeCursor.split('\n');
  const cursorLine = Math.max(0, (linesBeforeCursor?.length || 1) - 1);
  const textBeforeCursorOnLine = linesBeforeCursor[cursorLine] || '';
  
  /**
   * Handle text measurement for accurate cursor positioning
   * This measures the actual width of text before the cursor
   */
  const handleTextLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setMeasuredTextWidth(width);
  };
  
  // use measured width when available, fallback to approximation
  const cursorLeftPosition = measuredTextWidth;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Hidden text measurement component */}
      {/* this measures the exact width of text before cursor for accurate positioning */}
      <Text
        style={[
          styles.hiddenMeasureText,
          {
            color: colors.text.primary,
          }
        ]}
        onLayout={handleTextLayout}
      >
        {textBeforeCursorOnLine}
      </Text>
      
       {/* Hidden TextInput for keyboard and text handling */}
       {/* this input is invisible but handles all the actual text input logic */}
       <RNTextInput
         ref={hiddenInputRef}
         value={localText}
         onChangeText={handleTextChange}
         onSelectionChange={handleSelectionChange}
         onKeyPress={handleKeyPress}
         onFocus={handleFocus}
         onBlur={handleBlur}
         multiline={multiline}
         editable={editable}
         maxLength={maxLength}
         selectionColor={stylusColor}
         cursorColor={stylusColor}
         style={styles.hiddenInput}
         autoCorrect={true}
         spellCheck={true}
         // enable better multiline support
         blurOnSubmit={false}
         returnKeyType={multiline ? 'default' : 'done'}
         textAlignVertical="top"
         // prevent keyboard from closing
         showSoftInputOnFocus={true}
         // enable text suggestions and auto-fill
         // use default values to allow iOS/Android to provide suggestions
         keyboardType="default"
         enablesReturnKeyAutomatically={false}
         // allow system to provide contextual suggestions
         smartInsertDelete={true}
         contextMenuHidden={false}
       />
      
      {/* Visible text display area */}
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={1}
        delayPressIn={0}
        delayPressOut={0}
        style={[
          styles.visibleTextArea,
          {
            // border removed - no border around description input
            // always allow natural expansion - no height constraints
            // parent ScrollView in TaskCreationContent handles scrolling
            minHeight: minHeight, // minimum height for empty content
            flexShrink: 0, // prevent shrinking to allow expansion
            // use content height to size the container naturally
            height: finalHeight,
          },
          inputStyle,
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          // disable internal scrolling since parent ScrollView handles it
          // this allows the text area to expand naturally without internal scroll constraints
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.textScrollView}
          contentContainerStyle={styles.scrollContentExpanded}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          <View style={styles.textContainer}>
            {/* Render text lines for multiline support */}
            {safeText === '' ? (
              // Show placeholder when completely empty
              <View style={styles.lineContainer}>
                <Text
                  style={[
                    styles.text,
                    {
                      color: colors.text.tertiary,
                    }
                  ]}
                >
                  {placeholder}
                </Text>
                
                {/* Show cursor on placeholder line when focused with blinking */}
                {isFocused && (
                  <Animated.View
                    style={[
                      styles.cursor,
                      {
                        backgroundColor: stylusColor,
                        left: 0,
                        opacity: cursorOpacity,
                      }
                    ]}
                  />
                )}
              </View>
            ) : (
              // Render actual text lines with full multiline support
              (lines || []).map((line, lineIndex) => (
                <View key={lineIndex} style={styles.lineContainer}>
                  <Text
                    style={[
                      styles.text,
                      {
                        color: colors.text.primary,
                      }
                    ]}
                  >
                    {line || '\u00A0'} {/* Use non-breaking space for empty lines to maintain height */}
                  </Text>
                  
                  {/* Render cursor on the current line with iOS-style blinking */}
                  {isFocused && lineIndex === cursorLine && (
                    <Animated.View
                      style={[
                        styles.cursor,
                        {
                          backgroundColor: stylusColor,
                          left: cursorLeftPosition,
                          opacity: cursorOpacity,
                        }
                      ]}
                    />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Styles for CustomTextInput component
 */
const styles = StyleSheet.create({
  // main container
  container: {
    position: 'relative',
  },
  
  // hidden text input (invisible but handles input)
  hiddenInput: {
    position: 'absolute',
    top: -1000, // move off screen
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  
  // hidden text for measuring actual text width
  hiddenMeasureText: {
    position: 'absolute',
    top: -1000, // move off screen
    left: -1000,
    opacity: 0,
    // use same text styling as visible text for accurate measurement (getTextStyle includes fontFamily)
    ...getTextStyle('body-large'),
    lineHeight: 20,
  },
  
  // visible text display area
  visibleTextArea: {
    // border removed - no border around description input
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.listItemVertical,
    minHeight: 40,
    // no height constraints by default - allows natural expansion
    // height constraints are applied conditionally based on keyboard state
    // use flex properties that allow expansion
    alignSelf: 'stretch',
  },
  
  // scroll view for the text content
  textScrollView: {
    // don't use flex: 1 here as it interferes with dynamic height
  },
  
  // scroll content container (when keyboard is visible)
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  
  // scroll content container (when keyboard is hidden - allows natural expansion)
  scrollContentExpanded: {
    // no flex constraints - allows natural height expansion
  },
  
  // container for text lines
  textContainer: {
    // don't use flex: 1 to allow natural height calculation
    minHeight: 20, // ensure minimum height for empty content
  },
  
  // individual line container
  lineContainer: {
    position: 'relative',
    minHeight: 20, // ensure empty lines have height
  },
  
  // text styling (getTextStyle includes fontFamily)
  text: {
    ...getTextStyle('body-large'),
    lineHeight: 20,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  
  // cursor styling - matches iOS cursor appearance
  cursor: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 20, // matches line height
    borderRadius: 1,
    // iOS-style cursor is slightly rounded
  },
});

export default CustomTextInput;

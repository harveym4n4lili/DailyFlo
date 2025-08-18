# Frontend Full System Design - UX Design Document
## Design Tokens
### Colors
#### Primary palette (brand colors, semantic colors)
```
    // Token naming follows modern conventions: semantic-scale
    primary: {
    50: '#FFFFFF',   // pure white - light backgrounds, flow card backgrounds, modal surfaces
    100: '#F5F7FA',  // subtle off-white - page backgrounds, flow list backgrounds, settings panels
    200: '#959BA5',  // light neutral - secondary buttons, disabled flow buttons, inactive tab icons
    300: '#6B7280',  // medium neutral - flow descriptions, timestamp text, secondary nav labels
    400: '#374151',  // dark neutral - flow titles, streak counters, active tab labels
    500: '#111827',  // base brand color - main headings, primary text, app title, active flow text
    600: '#0F172A',  // slightly darker brand - primary buttons in dark mode, pressed states
    700: '#0C1320',  // deep neutral - bottom tab bar (dark mode), navigation headers (dark mode)
    800: '#111827',  // strong base for text in dark mode - flow cards text, main content (dark mode)
    900: '#0B111C'   // near-black - dark mode backgrounds, modal overlays, splash screen
    }
```
#### Status colors (success, error, warning, info)
```
    semantic: {
        success: '#10B981',  // green-500
        warning: '#F59E0B',  // amber-500
        error: '#EF4444',    // red-500
        info: '#3B82F6'      // blue-500
    }
```
#### Dark/light theme specifications
```
    themes: {
        light: {
            background: {
            primary: 'neutral.0',
            secondary: 'neutral.50',
            surface: 'neutral.0'
            },
            text: {
            primary: 'neutral.900',
            secondary: 'neutral.500'
            }
        },
        dark: {
            background: {
            primary: 'neutral.900',
            secondary: 'neutral.800', 
            surface: 'neutral.700'
            },
            text: {
            primary: 'neutral.0',
            secondary: 'neutral.300'
            }
        }
    }
```
### Typography
#### Font families and weights
```
    fontFamily: {
        primary: ['Satoshi', 'system-ui', 'sans-serif'], // Satoshi as main font
        fallback: {
            ios: ['SF Pro Display', '-apple-system'],      // iOS fallback
            android: ['Roboto', 'sans-serif']              // Android fallback
        }
    }

    fontWeight: {
        // Using Satoshi's actual font weights
        light: '300',      // Satoshi Light
        regular: '400',    // Satoshi Regular  
        medium: '500',     // Satoshi Medium
        semibold: '600',   // Satoshi SemiBold
        bold: '700'        // Satoshi Bold
        // black: '900'    // Satoshi Black (if available)
    }
```
#### Type scales (headings, body, captions)
```
    fontSize: {
        'xs': '12px',    // caption, small text
        'sm': '14px',    // body small
        'base': '16px',  // body default
        'lg': '18px',    // body large
        'xl': '20px',    // h4
        '2xl': '24px',   // h3
        '3xl': '30px',   // h2
        '4xl': '36px'    // h1
    }
```
#### Line heights and letter spacing
```
    lineHeight: {
        tight: '1.25',   // headings
        normal: '1.5',   // body text
        relaxed: '1.75'  // long form content
    }

    letterSpacing: {
        tight: '-0.025em',  // large headings
        normal: '0',        // body
        wide: '0.025em'     // small text, caps
    }
```
#### Responsive typography rules
```
    // Scale factors for different screen sizes
        typography: {
        mobile: { scale: 1 },
        tablet: { scale: 1.125 },
        desktop: { scale: 1.25 }
    }
```
### Spacing & Layout
#### Spacing scale (4px, 8px, 16px, etc.)
```
    space: {
        0: '0px',
        1: '4px',    // xs
        2: '8px',    // sm  
        3: '12px',
        4: '16px',   // md - base unit
        5: '20px',
        6: '24px',   // lg
        8: '32px',   // xl
        10: '40px',
        12: '48px',  // 2xl
        16: '64px',  // 3xl
        20: '80px',
        24: '96px'   // 4xl
    }
```
#### Grid system specifications
```
    breakpoints: {
        sm: '380px',   // small phones
        md: '768px',   // tablets
        lg: '1024px',  // desktop
        xl: '1280px'   // large desktop
    }

    container: {
        padding: 'space.4',  // 16px default
        maxWidth: {
            sm: '100%',
            md: '768px',
            lg: '1024px'
        }
    }
```
#### Container max-widths
```
    maxWidth: {
        content: '65ch',     // optimal reading width
        container: '1200px', // main content container
        screen: '100vw'      // full screen
    }
```
### Shadows & Elevation
#### Shadow tokens for different elevation levels
```
    shadows: {
        xs: {
            ios: {
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1
            },
            android: { elevation: 1 }
        },
        sm: {
            ios: {
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2
            },
            android: { elevation: 2 }
        },
        md: {
            ios: {
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6
            },
            android: { elevation: 4 }
        },
        lg: {
            ios: {
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15
            },
            android: { elevation: 8 }
        }
    }
```

## Component Library
### Core Components
Button variants (primary, secondary, ghost, etc.)
Input fields (text, password, search, etc.)
Cards and containers
Navigation components
Modal and overlay patterns
### Specialized Components
Flow-specific components (habit trackers, progress bars)
Data visualization components
Onboarding and tutorial components
### Component API Standards
Props naming conventions
Accessibility requirements
Error state handling
Loading state patterns

## Accessibility Standards
WCAG compliance requirements
Screen reader support
Touch target sizes
Color contrast ratios
Focus management

## Platform Considerations
### iOS Specific
Human Interface Guidelines adherence
Native component usage
Safe area handling
### Android Specific
Material Design integration
Android-specific patterns
Navigation behavior

## Implementation Guidelines
### Style Organization
How to structure style files
Theme provider setup
CSS-in-JS conventions (if using styled-components/emotion)

## Testing Standards
Visual regression testing approach
Component testing requirements
Accessibility testing protocols

## Documentation & Maintenance
Component documentation standards
Design token update process
Version control for design changes
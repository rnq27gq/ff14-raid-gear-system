# FF14 Raid Gear Allocation System

A comprehensive web application for managing gear distribution in Final Fantasy XIV raid teams. Built for static groups who want fair, transparent, and efficient loot allocation.

## Overview

This system helps 8-person raid teams manage equipment distribution using a fair priority-based algorithm. It supports real-time collaboration, tracks player preferences, and maintains historical data to ensure equitable gear distribution over time.

## Key Features

### Gear Distribution
- **Need/Greed/Pass System**: Standard MMO loot distribution mechanics
- **Smart Priority Calculation**: Considers position priority, gear policies, and acquisition history
- **Weapon Distribution**: Specialized handling for weapon coffers and direct drops
- **Tome Exchange Support**: Advanced tracking for tome-exchanged gear with conditional priority

### Team Management
- **8-Position Support**: MT/ST/H1/H2/D1/D2/D3/D4 with job assignments
- **Gear Policy Management**: Individual player preferences for raid vs tome gear
- **Weapon Preference System**: Priority ranking for weapon types

### Security & Access
- **Team-Based Authentication**: Secure team creation with password protection
- **Password Recovery**: Security question-based password reset system
- **Real-time Synchronization**: Live updates across all team members

### Analytics & History
- **Acquisition Statistics**: Comprehensive tracking of gear distribution
- **Distribution History**: Complete log of all past allocations
- **Manual Adjustments**: Admin controls for correcting data

## Quick Start

### Demo Access
Visit the live application: [https://rnq27gq.github.io/ff14-raid-gear-system/](https://rnq27gq.github.io/ff14-raid-gear-system/)

**Demo Account:**
- Team ID: `demo-team`
- Password: `demo123`

### Creating Your Team

1. **Visit the Application**
   - Navigate to the application URL
   - Click "Create New Team"

2. **Team Setup**
   - Choose a unique Team ID (3-20 characters, alphanumeric)
   - Set a secure password (6+ characters)
   - Enter creator name for password recovery
   - Set security question and answer

3. **Member Configuration**
   - Add all 8 team members with their preferred jobs
   - Configure gear policies (Raid vs Tome preference for each slot)
   - Set weapon preferences (1st through 4th choice)

4. **Start Distributing**
   - Access the allocation system
   - Select dropped items from tier menus
   - Review system recommendations
   - Confirm distributions

## How Distribution Works

### Priority Calculation

The system calculates distribution priority using multiple factors:

1. **Gear Policy**: Players prioritizing raid gear get higher priority than those preferring tome gear
2. **Position Priority**: Customizable ordering (default: D1 → D2 → D3 → D4 → MT → ST → H1 → H2)
3. **Acquisition History**: Dynamic adjustments based on previous gear received
4. **Weapon Preferences**: Ranking system for weapon types

### Scoring System

- **Raid Need**: 1000 + position priority - dynamic penalty
- **Tome Greed**: 500 + position priority - dynamic penalty
- **Weapon Coffer**: 2000 + position priority - dynamic penalty
- **Direct Drop Weapon**: 3000 + position priority - preference ranking × 100 - dynamic penalty

### Tome Exchange System

Advanced feature for players who exchange gear using tomes:
- **Temporary Exclusion**: Tome exchange players are excluded while raid-policy players need gear
- **Conditional Re-entry**: Become eligible again when no raid-policy players need the item
- **Automatic Status Updates**: System automatically updates status when coffers are received

## Technical Requirements

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Database Setup

The application uses Supabase as its backend. For new deployments:

1. **Create Supabase Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Database**
   ```sql
   -- Enable required extensions
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   
   -- Create teams table
   CREATE TABLE teams (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       team_id VARCHAR(50) UNIQUE NOT NULL,
       team_name VARCHAR(100) NOT NULL,
       password_hash VARCHAR(255),
       security_question TEXT,
       security_answer_hash VARCHAR(255),
       reset_token VARCHAR(100),
       reset_token_expires TIMESTAMP WITH TIME ZONE,
       created_by VARCHAR(100),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create raid data table
   CREATE TABLE raid_data (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       team_id VARCHAR(50) NOT NULL,
       tier_id VARCHAR(50) NOT NULL,
       data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('players', 'allocations', 'settings', 'equipmentData')),
       content JSONB NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Enable Row Level Security**
   ```sql
   ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
   ALTER TABLE raid_data ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Teams can only access their own data" ON raid_data
       FOR ALL USING (team_id = current_setting('app.current_team_id', true));
   ```

## User Guide

### For Team Leaders

1. **Initial Setup**
   - Create team account with secure credentials
   - Add all 8 members with accurate job information
   - Configure position priority order if different from default
   - Set up gear policies for each member

2. **Weekly Operations**
   - Access the allocation system before raid night
   - Input dropped items as they occur
   - Review and confirm system recommendations
   - Handle any manual adjustments needed

3. **Maintenance**
   - Regularly review statistics for fairness
   - Update member information as needed
   - Export data for backup purposes

### For Team Members

1. **Initial Configuration**
   - Provide job and character information to team leader
   - Specify gear preferences (raid vs tome for each slot)
   - Set weapon preference ranking

2. **Ongoing Use**
   - View current allocation statistics
   - Check distribution history
   - Access the system during raids for real-time updates

### For Administrators

1. **Data Management**
   - Monitor system performance and usage
   - Perform regular database maintenance
   - Handle password reset requests if needed

2. **Troubleshooting**
   - Check browser console for JavaScript errors
   - Verify Supabase connection status
   - Assist with data corrections when necessary

## Advanced Features

### Position Priority Customization

Teams can adjust the default position priority order:
1. Access "Priority Settings" from the dashboard
2. Drag and drop positions to reorder
3. Save changes - affects all future distributions

### Manual Statistics Editing

For corrections or adjustments:
1. Navigate to "Statistics" section
2. Click "Edit Mode"
3. Toggle acquisition status for any item
4. Save changes to update system state

### Data Export/Import

- **Export**: Download complete team data as JSON
- **Import**: Upload data from previous systems or backups
- **CSV Support**: Import basic member information via CSV

## Security Considerations

### Password Management
- Use strong, unique passwords for team accounts
- Choose security questions with memorable but non-obvious answers
- Regularly update passwords if team membership changes

### Data Privacy
- Team data is isolated using row-level security
- No cross-team data access possible
- Regular backups recommended for important progression

### Access Control
- Team IDs should be shared only with trusted members
- Consider rotating credentials if members leave
- Monitor access logs for unusual activity

## Troubleshooting

### Common Issues

**Login Problems**
- Verify team ID and password spelling
- Use password reset if credentials are forgotten
- Check browser console for connection errors

**Data Sync Issues**
- Refresh page to force resynchronization
- Verify internet connection stability
- Clear browser cache if problems persist

**Performance Issues**
- Ensure modern browser version
- Close unnecessary browser tabs
- Check for JavaScript errors in console

### Getting Help

For technical issues or feature requests:
1. Check the troubleshooting section above
2. Verify your browser meets minimum requirements
3. Contact system administrator with specific error messages

## Development

### Architecture
- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Hosting**: GitHub Pages (static hosting)
- **Security**: Row-level security + bcrypt password hashing

### Contributing
This project is designed for Final Fantasy XIV raid teams. While primarily for internal use, feedback and suggestions are welcome.

## License

This project is intended for personal and team use within the Final Fantasy XIV community. Not for commercial distribution.

---

**Designed for the Final Fantasy XIV raiding community**
# HSK Learning System - Todos

## Completed Tasks
- [x] Enhanced search functionality (simplified/traditional Chinese, English pinyin without tones)
- [x] Replace "新增生詞" with "收藏生詞庫" (Favorites system)
- [x] Add word count selection before training modes (flashcard, test, multiple-choice, pinyin practice)
- [x] Add favorite buttons on results pages
- [x] Favorites training integration with all training modes
- [x] Search works with English letters as pinyin substitute (no tones needed)
- [x] Add Same.new-style login popup modal with blurred background
- [x] Username and password authentication
- [x] Google Sheets User table integration for authentication
- [x] Logout button in homepage header
- [x] Login failure limit (3 attempts max)
- [x] Account locking with lock time display
- [x] Login history recording and display

## Features Implemented

### 1. Login Security System (NEW)
- **Login failure tracking**: 3 attempts maximum
- **Account locking**: After 3 failed attempts, account is locked
- **Lock time display**: Shows "鎖定於 YYYY-MM-DD HH:MM" in login modal
- **Remaining attempts warning**: Shows "剩餘 X 次嘗試機會"
- **Google Sheets D column**: LockTime is recorded when account is locked
- **Login history**: Records all login attempts (success/failure)
- **History display**: Table showing timestamp, username, status, IP

### 2. Login System
- Same.new-inspired centered modal with rounded corners
- Blurred overlay background (cannot bypass)
- Username and password input fields
- Google Sheets "User" table authentication support
- Default fallback credentials: admin / admin123
- Logout button on homepage
- Login state persisted in localStorage

### 3. Enhanced Search
- Supports simplified Chinese (简体)
- Supports traditional Chinese (繁體)
- Supports pinyin with tones (pínyīn)
- Supports English letters without tones (pinyin)
- Supports Thai meanings

### 4. Favorites System
- Add/remove words to favorites from browse page
- Add/remove words to favorites from training results
- View all favorites in dedicated page
- Train using only favorite words
- Favorites stored in localStorage (per device)

### 5. Training Modes
- Flashcard mode
- Test mode (type answer)
- Multiple choice mode
- Speed challenge mode
- Matching game mode
- Pinyin practice mode

## Google Sheets Structure

### User 工作表
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ID | Username | Password | LockTime | FailCount | LastAttempt |

### LoginHistory 工作表
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| ID | Timestamp | Username | Success | IP | UserAgent |

## Backend Code
- `google-apps-script-auth.js` - Copy to Google Apps Script for authentication features

## Notes
- Default login: admin / admin123
- After 3 failed login attempts, account is locked
- Locked accounts show lock time and require admin to unlock
- Run `initUserSystem()` in Google Apps Script to initialize tables

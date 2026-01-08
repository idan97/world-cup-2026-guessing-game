# Tiebreaker Logic - לוגיקת שוברי השוויון

## סקירה כללית

כאשר שני משתמשים או יותר מגיעים לאותו ניקוד כולל בליגה, המערכת משתמשת בסדרת שוברי שוויון כדי לקבוע את הדירוג המדויק.

## סדר שוברי השוויון

שוברי השוויון מיושמים בסדר הבא (מהחשוב ביותר לפחות חשוב):

### 1. ניקוד כולל (Total Points)
הניקוד הכולל שצבר המשתמש מכל המשחקים, העלאות וניחושים.

### 2. פגיעות מדויקות בתוצאה (Exact Results)
מספר המשחקים שבהם המשתמש ניחש את התוצאה המדויקת (ציון שתי הקבוצות).

### 3. פגיעות בהכרעה (Correct Decisions)
מספר המשחקים שבהם המשתמש ניחש נכון את ההכרעה (ניצחון/תיקו/הפסד).

### 4. פגיעה באלופה (Correct Champion)
האם המשתמש ניחש נכון את הקבוצה המנצחת במונדיאל.

### 5. פגיעה במלך השערים (Correct Top Scorer)
האם המשתמש ניחש נכון את מלך השערים של המונדיאל.

### 6-9. עליית קבוצות נכונה לפי שלב
מספר הקבוצות שהמשתמש ניחש נכון שיעלו לכל שלב, בסדר חשיבות יורד:
- **גמר (F)** - הכי חשוב
- **חצי גמר (SF)**
- **רבע גמר (QF)**
- **שמינית גמר (R16)** - הכי פחות חשוב

## מימוש טכני

### API Endpoint

```
GET /api/leagues/:id/leaderboard
```

מחזיר רשימה ממוינת של כל המשתתפים בליגה, כולל:
- דירוג (rank)
- שם משתמש ושם טופס
- ניקוד כולל
- כל הסטטיסטיקות של שוברי השוויון

### דוגמה לתגובה

```json
[
  {
    "rank": 1,
    "userId": "user_123",
    "displayName": "יוסי כהן",
    "formId": "form_456",
    "nickname": "המנצח",
    "totalPoints": 125,
    "tiebreakers": {
      "exactResults": 15,
      "correctDecisions": 42,
      "correctChampion": true,
      "correctTopScorer": true,
      "correctAdvances": {
        "F": 2,
        "SF": 3,
        "QF": 6,
        "R16": 12
      }
    }
  },
  ...
]
```

## Services המעורבים

### ScoringService
- `calculateTiebreakers(formId, actualTopScorer)` - מחשב את כל הסטטיסטיקות לשוברי שוויון

### TournamentSettingsService
- `getActualTopScorer()` - מחזיר את מלך השערים האמיתי מהגדרות המונדיאל
- `setActualTopScorer(playerName)` - מאפשר למנהלים לעדכן את מלך השערים

## עדכון הגדרות המונדיאל (Admin)

### GET /api/admin/tournament/settings
מחזיר את הגדרות המונדיאל הנוכחיות.

### PUT /api/admin/tournament/top-scorer
מעדכן את מלך השערים האמיתי.

```json
{
  "playerName": "Kylian Mbappé"
}
```

או למחיקה:
```json
{
  "playerName": null
}
```

## Database Schema

### TournamentSettings Table

| Column | Type | Description |
|--------|------|-------------|
| id | String | Primary key (default: 'tournament_2026') |
| actualTopScorer | String? | שם מלך השערים האמיתי |
| updatedAt | DateTime | זמן עדכון אחרון |

## הערות למפתחים

1. הפונקציה `calculateTiebreakers` מחשבת את כל הסטטיסטיקות בזמן ריצה, מה שמאפשר גמישות אך עלול להיות עתיר משאבים עבור ליגות גדולות.

2. למנהלי הליגה תהיה גישה לעדכן את מלך השערים רק דרך ה-Admin API.

3. לוגיקת המיון מיושמת ב-JavaScript בזיכרון לאחר שליפת הנתונים. בעתיד ניתן לשקול מיון ברמת הבסיס נתונים לביצועים טובים יותר.

4. כל שוברי השוויון מחושבים רק על משחקים שהסתיימו (`isFinished = true`).


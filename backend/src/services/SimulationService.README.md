# SimulationService - שירות סימולציית תוצאות

## מטרה
שירות זה מאפשר לבצע סימולציה של תוצאות משחקים ולחשב את טבלת הניקוד המדומה עבור כל חברי הליגה.
השירות מועיל במיוחד לסימולציית תרחישי "What-If" ולראות איך תוצאות משחקים עתידיות ישפיעו על הדירוג.

## API Routes

### 1. POST /simulate/calculate
חישוב סימולציה כללית (מקבל את מזהה הליגה בגוף הבקשה)

**Request Body:**
```json
{
  "leagueId": "league-uuid",
  "simulatedResults": [
    {
      "matchId": "match-uuid-1",
      "team1Score": 2,
      "team2Score": 1,
      "winnerId": "team-uuid-1"
    },
    {
      "matchId": "match-uuid-2",
      "team1Score": 0,
      "team2Score": 0,
      "winnerId": null
    }
  ],
  "actualTopScorer": "Messi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "leagueId": "league-uuid",
    "simulatedResultsCount": 2,
    "leaderboard": [
      {
        "formId": "form-uuid",
        "userId": "user-uuid",
        "nickname": "John Doe",
        "totalPoints": 150,
        "rank": 1,
        "breakdown": {
          "matchPoints": 142,
          "advancePoints": 0,
          "topScorerPoints": 8
        },
        "tiebreakers": {
          "exactResults": 25,
          "correctDecisions": 45,
          "correctChampion": true,
          "correctTopScorer": true,
          "correctAdvances": {
            "F": 0,
            "SF": 0,
            "QF": 0,
            "R16": 0
          }
        }
      }
    ]
  }
}
```

### 2. POST /simulate/league/:id/calculate
חישוב סימולציה לליגה ספציפית (קיצור דרך)

**URL Parameter:**
- `id` - מזהה הליגה

**Request Body:**
```json
{
  "simulatedResults": [
    {
      "matchId": "match-uuid-1",
      "team1Score": 2,
      "team2Score": 1,
      "winnerId": "team-uuid-1"
    }
  ],
  "actualTopScorer": "Ronaldo"
}
```

**Response:** זהה לנתיב הקודם

## שימוש בשירות

### דוגמה: חישוב סימולציה ב-Service

```typescript
import { simulateLeagueScoring } from '../services/SimulationService';

const result = await simulateLeagueScoring({
  leagueId: 'my-league-id',
  simulatedResults: [
    {
      matchId: 'match-1',
      team1Score: 3,
      team2Score: 1,
      winnerId: 'team-1',
    },
  ],
  actualTopScorer: 'Messi',
});

console.log('Leaderboard:', result);
```

## שיטת החישוב

### 1. אימות נתונים
- בדיקה שהליגה קיימת
- בדיקה שכל מזהי המשחקים תקפים
- אימות תקינות התוצאות

### 2. חישוב ניקוד למשחקים
עבור כל ניחוש משחק:
- השוואה של ההכרעה המנוחשת מול התוצאה המדומה
- נקודות על הכרעה נכונה (משתנה לפי שלב)
- נקודות נוספות על תוצאה מדויקת (3 נק')

### 3. חישוב ניקוד למלך השערים
- 8 נקודות על ניחוש נכון של מלך השערים

### 4. מיון לפי שוברי שוויון
הסדר:
1. סך הניקוד
2. פגיעות מדויקות בתוצאה
3. פגיעות בהכרעה
4. פגיעה באלופה
5. פגיעה במלך השערים
6. עליות נכונות (גמר > חצי > רבע > שמינית)

## הערות חשובות

- השירות **לא משנה** את ה-Database - זו סימולציה בלבד
- התוצאות מחושבות בזמן אמת ולא נשמרות
- ניתן להריץ מספר סימולציות שונות במקביל
- חישוב העלאות קבוצות (advances) כרגע לא מיושם במלואו - ניתן להרחיב בעתיד

## אבטחה

- כל ה-endpoints דורשים אימות (`requireAuth`)
- המשתמש חייב להיות חבר בליגה (ניתן להוסיף middleware בעתיד)

## ביצועים

- השירות אופטימלי לעד ~100 משתמשים בליגה
- עבור ליגות גדולות יותר, שקול להשתמש ב-caching או background jobs


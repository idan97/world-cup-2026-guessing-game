# Leaderboard Implementation - מימוש לוח התוצאות

## סקירה כללית

מערכת לוח התוצאות מספקת דירוג מלא של משתתפי ליגה, כולל חישוב ניקוד מדויק ושוברי שוויון מורכבים.

## API Endpoint

```
GET /api/leagues/:id/leaderboard
```

**Authentication:** נדרש JWT + חברות בליגה  
**Authorization:** מתבצעת דרך middleware `requireLeagueMembership`

## ארכיטקטורה

### שכבה 1: Controller
**קובץ:** `backend/src/controllers/LeagueController.ts`  
**פונקציה:** `getLeagueLeaderboard`

**תהליך:**
1. שליפת מלך השערים האמיתי מהגדרות הטורניר
2. שליפת כל חברי הליגה
3. עבור כל חבר:
   - שליפת הטופס שלו
   - חישוב ניקוד כולל (`calculateTotalScore`)
   - חישוב סטטיסטיקות שוברי שוויון (`calculateTiebreakers`)
4. מיון התוצאות לפי ניקוד ושוברי שוויון
5. הוספת דירוג (rank) לכל entry
6. החזרת מערך ממוין

### שכבה 2: Services

#### ScoringService
**קובץ:** `backend/src/services/ScoringService.ts`

**פונקציות עיקריות:**

##### `calculateTotalScore(formId, actualTopScorer)`
מחשבת את הניקוד הכולל של טופס.

**תהליך:**
1. חישוב ניקוד ממשחקים (matchPoints)
2. חישוב ניקוד מהעלאות (advancePoints)
3. חישוב ניקוד ממלך השערים (topScorerPoints)
4. סיכום והחזרת פירוט מלא

**החזרה:**
```typescript
{
  totalPoints: number;
  breakdown: {
    matchPoints: number;
    advancePoints: number;
    topScorerPoints: number;
  };
  detailedBreakdown: {
    byStage: Record<Stage, number>;
    advancesByStage: Record<string, number>;
  };
}
```

##### `calculateMatchScore(match, pick)`
מחשבת ניקוד למשחק בודד.

**לוגיקה:**
1. אם המשחק לא הסתיים - 0 נקודות
2. השוואת outcome (W/D/L):
   - אם נכון: נקודות על הכרעה
   - אם גם הציון מדויק: נקודות נוספות על תוצאה מדויקת
3. החזרת סכום הנקודות

##### `calculateAdvanceScore(formId, stage)`
מחשבת ניקוד על העלאת קבוצות לשלב מסוים.

**לוגיקה:**
1. שליפת ניחושי המשתמש לשלב
2. שליפת הקבוצות שבאמת עלו (מ-matches בשלב)
3. ספירת הקבוצות שהמשתמש ניחש נכון
4. כפל בנקודות ההעלאה של השלב הקודם

##### `calculateTopScorerScore(formId, actualTopScorer)`
מחשבת ניקוד על ניחוש מלך השערים.

**לוגיקה:**
- השוואה case-insensitive של שמות
- 8 נקודות אם נכון, 0 אחרת

##### `calculateTiebreakers(formId, actualTopScorer)`
מחשבת סטטיסטיקות לשוברי שוויון.

**החזרה:**
```typescript
{
  exactResults: number;        // פגיעות מדויקות בתוצאה
  correctDecisions: number;     // פגיעות בהכרעה
  correctChampion: boolean;     // פגיעה באלופה
  correctTopScorer: boolean;    // פגיעה במלך השערים
  correctAdvances: {
    F: number,
    SF: number,
    QF: number,
    R16: number
  };
}
```

#### TournamentSettingsService
**קובץ:** `backend/src/services/TournamentSettingsService.ts`

**פונקציות:**
- `getActualTopScorer()` - מחזיר את מלך השערים האמיתי
- `setActualTopScorer(playerName)` - מעדכן את מלך השערים (Admin only)
- `getSettings()` - מחזיר את כל ההגדרות

## מטריצת ניקוד

```typescript
const SCORING_MATRIX = {
  GROUP: {
    decision: 1,      // הכרעה
    exactResult: 3,   // תוצאה מדויקת
    advance: 2,       // עלייה ל-R32
  },
  R32: {
    decision: 3,
    exactResult: 3,
    advance: 2,       // עלייה ל-R16
  },
  R16: {
    decision: 3,
    exactResult: 3,
    advance: 4,       // עלייה לרבע גמר
  },
  QF: {
    decision: 5,
    exactResult: 3,
    advance: 6,       // עלייה לחצי גמר
  },
  SF: {
    decision: 7,
    exactResult: 3,
    advance: 8,       // עלייה לגמר
  },
  F: {
    decision: 9,
    exactResult: 3,
    advance: 0,       // אין שלב הבא
  },
};

const TOP_SCORER_POINTS = 8;
```

## לוגיקת שוברי שוויון

מיושם ב-`LeagueController.getLeagueLeaderboard` (שורות 375-413):

```typescript
leaderboardEntries.sort((a, b) => {
  // 1. Total points (descending)
  if (a.totalPoints !== b.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }

  // 2. Exact results (descending)
  if (a.tiebreakers.exactResults !== b.tiebreakers.exactResults) {
    return b.tiebreakers.exactResults - a.tiebreakers.exactResults;
  }

  // 3. Correct decisions (descending)
  if (a.tiebreakers.correctDecisions !== b.tiebreakers.correctDecisions) {
    return b.tiebreakers.correctDecisions - a.tiebreakers.correctDecisions;
  }

  // 4. Correct champion
  if (a.tiebreakers.correctChampion !== b.tiebreakers.correctChampion) {
    return a.tiebreakers.correctChampion ? -1 : 1;
  }

  // 5. Correct top scorer
  if (a.tiebreakers.correctTopScorer !== b.tiebreakers.correctTopScorer) {
    return a.tiebreakers.correctTopScorer ? -1 : 1;
  }

  // 6-9. Correct advances by stage (F > SF > QF > R16)
  const stages = ['F', 'SF', 'QF', 'R16'];
  for (const stage of stages) {
    const aAdvances = a.tiebreakers.correctAdvances[stage] || 0;
    const bAdvances = b.tiebreakers.correctAdvances[stage] || 0;
    if (aAdvances !== bAdvances) {
      return bAdvances - aAdvances;
    }
  }

  return 0;
});
```

## תגובת API לדוגמה

```json
{
  "success": true,
  "message": "Success",
  "data": [
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
    }
  ]
}
```

## שיקולי ביצועים

### נוכחי (MVP)
- חישוב בזמן אמת לכל קריאת API
- לא מתאים לליגות עם מאות משתתפים
- יתרון: תמיד מעודכן, אין צורך ב-cron jobs

### אופטימיזציות עתידיות
1. **Cache ברמת הליגה**
   - Redis cache עם TTL של 5 דקות
   - Invalidation כשמתעדכן משחק
   
2. **Pre-calculation**
   - חישוב מראש של scores וstorage ב-DB
   - עדכון כשמתעדכנת תוצאת משחק
   - טבלת `LeagueStandings` עם timestamp
   
3. **Pagination**
   - הוספת limit/offset לליגות גדולות
   - החזרת top 100 by default

## הערות למפתחים

1. **Thread Safety**: הפונקציות thread-safe כי Prisma מנהל את ה-connection pool
2. **Transactions**: לא נדרשות כי אין writes, רק reads
3. **Error Handling**: נתפס ב-controller ומוחזר כ-500
4. **Logging**: לוג שגיאות ב-`logger.error` עם context מלא
5. **Testing**: אין טסטים עדיין - TODO לעתיד

## קבצים רלוונטיים

- `backend/src/controllers/LeagueController.ts` (שורות 314-429)
- `backend/src/services/ScoringService.ts`
- `backend/src/services/TournamentSettingsService.ts`
- `backend/src/routes/leagues.ts` (שורות 19-24)
- `backend/docs/TIEBREAKER_LOGIC.md`
- `backend/docs/BACKEND_DESIGN.md` (סעיף 5)

## סטטוס

✅ **מיושם ועובד**
- חישוב ניקוד מלא
- שוברי שוויון
- API endpoint
- תיעוד

🔲 **TODO עתידי**
- טסטים
- Cache
- Pagination
- Admin API לעדכון מלך השערים מהממשק

## דוגמאות שימוש

### Frontend (React/Next.js)
```typescript
import { useApi } from '@/lib/useApi';

function LeagueLeaderboard({ leagueId }: { leagueId: string }) {
  const { data, error, isLoading } = useApi(
    `/leagues/${leagueId}/leaderboard`
  );

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <table>
      <thead>
        <tr>
          <th>דירוג</th>
          <th>שם</th>
          <th>ניקוד</th>
        </tr>
      </thead>
      <tbody>
        {data.map((entry) => (
          <tr key={entry.userId}>
            <td>{entry.rank}</td>
            <td>{entry.displayName}</td>
            <td>{entry.totalPoints}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### cURL
```bash
curl http://localhost:3000/api/leagues/LEAGUE_ID/leaderboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### TypeScript (Backend)
```typescript
import { calculateTotalScore, calculateTiebreakers } from '@/services/ScoringService';
import { TournamentSettingsService } from '@/services/TournamentSettingsService';

// חישוב ניקוד לטופס בודד
const actualTopScorer = await TournamentSettingsService.getActualTopScorer();
const score = await calculateTotalScore('form-id-123', actualTopScorer);
console.log(`Total: ${score.totalPoints}`);

// חישוב tiebreakers
const tiebreakers = await calculateTiebreakers('form-id-123', actualTopScorer);
console.log(`Exact results: ${tiebreakers.exactResults}`);
```

---

**עודכן לאחרונה:** ינואר 2026  
**גרסה:** 1.0  
**מחבר:** AI Assistant


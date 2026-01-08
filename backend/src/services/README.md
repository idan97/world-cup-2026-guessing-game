# Services Layer

תיקיה זו מכילה את שכבת השירותים (Business Logic) של המערכת.

## ScoringService

שירות לחישוב ניקוד של טפסי ניחושים למונדיאל 2026.

### מטריצת הניקוד

הניקוד מחושב לפי הכללים הבאים:

#### שלב הבתים (GROUP)
- **הכרעה נכונה**: 1 נקודה
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 4)
- **עלייה ל-R32**: 2 נקודות לכל קבוצה

#### שלב 32 (R32)
- **הכרעה נכונה**: 3 נקודות
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 6)
- **עלייה לשמינית גמר**: 2 נקודות לכל קבוצה

#### שמינית גמר (R16)
- **הכרעה נכונה**: 3 נקודות
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 6)
- **עלייה לרבע גמר**: 4 נקודות לכל קבוצה

#### רבע גמר (QF)
- **הכרעה נכונה**: 5 נקודות
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 8)
- **עלייה לחצי גמר**: 6 נקודות לכל קבוצה

#### חצי גמר (SF)
- **הכרעה נכונה**: 7 נקודות
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 10)
- **עלייה לגמר**: 8 נקודות לכל קבוצה

#### גמר (F)
- **הכרעה נכונה**: 9 נקודות
- **תוצאה מדויקת**: +3 נקודות נוספות (סה"כ 12)

#### מלך השערים
- **ניחוש נכון**: 8 נקודות

### שוברי שוויון

במקרה של תיקו בניקוד, סדר שוברי השוויון:
1. פגיעות מדויקות בתוצאה
2. פגיעות בהכרעה
3. פגיעה באלופה
4. פגיעה במלך השערים
5. עלייה נכונה לגמר
6. עלייה נכונה לחצי גמר
7. עלייה נכונה לרבע גמר
8. עלייה נכונה לשמינית גמר

### פונקציות ציבוריות

#### `calculateMatchScore(match, pick): number`
מחשבת ניקוד למשחק בודד.

#### `calculateAdvanceScore(formId, stage): Promise<number>`
מחשבת ניקוד על העלאת קבוצות לשלב הבא.

#### `calculateTopScorerScore(formId, actualTopScorer): Promise<number>`
מחשבת ניקוד על ניחוש מלך השערים.

#### `calculateTotalScore(formId, actualTopScorer): Promise<ScoreResult>`
מחשבת את הניקוד הכולל של טופס, כולל פירוט מלא.

#### `calculateTiebreakers(formId): Promise<TiebreakerStats>`
מחשבת סטטיסטיקות לשוברי שוויון.

#### `updateFormScore(formId, actualTopScorer): Promise<void>`
מעדכנת את הניקוד של טופס בבסיס הנתונים.

#### `updateAllScores(actualTopScorer, leagueId?): Promise<void>`
מעדכנת את הניקוד של כל הטפסים (בליגה או בכלל).

### שימוש לדוגמה

```typescript
import { calculateTotalScore, updateFormScore } from './services/ScoringService';

// חישוב ניקוד לטופס
const result = await calculateTotalScore('form-id', 'Kylian Mbappe');
console.log(`Total: ${result.totalPoints}`);
console.log(`Match points: ${result.breakdown.matchPoints}`);
console.log(`Advance points: ${result.breakdown.advancePoints}`);

// עדכון ניקוד בבסיס הנתונים
await updateFormScore('form-id', 'Kylian Mbappe');
```

## MatchResultService

שירות לעדכון תוצאות משחקים ועדכון טבלאות הבתים.

---

## הוספת שירות חדש

כדי להוסיף שירות חדש:

1. צור קובץ חדש בתיקייה זו (לדוגמה: `MyService.ts`)
2. ייצא את הפונקציות הציבוריות
3. הוסף את השירות ל-`index.ts`:
   ```typescript
   export * from './MyService';
   ```
4. עדכן קובץ README זה עם תיעוד של השירות החדש


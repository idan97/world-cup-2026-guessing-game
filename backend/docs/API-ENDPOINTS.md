# API Endpoints Documentation

## 🆕 New Endpoints (Sprint 1)

### Standings API

#### `GET /api/standings`
קבלת טבלאות דירוג לכל הקבוצות או לקבוצות ספציפיות

**Query Parameters:**
- `group` (optional): אות קבוצה (A-L). ניתן לשלוח מספר פעמים לסינון קבוצות מסוימות
  - דוגמה: `?group=A&group=B`

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "groups": {
      "A": [
        {
          "id": "cuid...",
          "groupLetter": "A",
          "position": 1,
          "teamId": "team_id",
          "played": 3,
          "wins": 2,
          "draws": 1,
          "losses": 0,
          "goalsFor": 5,
          "goalsAgainst": 2,
          "goalDiff": 3,
          "points": 7,
          "team": {
            "id": "team_id",
            "fifaCode": "1",
            "name": "Mexico",
            "nameHebrew": "מקסיקו",
            "groupLetter": "A"
          }
        }
      ]
    },
    "metadata": {
      "groupsIncluded": ["A", "B"],
      "totalGroups": 2
    }
  }
}
```

---

#### `GET /api/standings/:groupLetter`
קבלת טבלת דירוג לקבוצה ספציפית

**Path Parameters:**
- `groupLetter`: אות קבוצה (A-L)

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "groupLetter": "A",
    "standings": [
      {
        "id": "cuid...",
        "groupLetter": "A",
        "position": 1,
        "teamId": "team_id",
        "played": 3,
        "wins": 2,
        "draws": 1,
        "losses": 0,
        "goalsFor": 5,
        "goalsAgainst": 2,
        "goalDiff": 3,
        "points": 7,
        "team": {
          "id": "team_id",
          "fifaCode": "1",
          "name": "Mexico",
          "nameHebrew": "מקסיקו"
        }
      }
    ]
  }
}
```

---

#### `GET /api/standings/third-place/rankings`
קבלת דירוג הקבוצות השלישיות (עבור העפלה ל-R32)

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "cuid...",
      "groupLetter": "E",
      "teamId": "team_id",
      "rank": 1,
      "points": 6,
      "goalDiff": 4,
      "goalsFor": 7,
      "team": {
        "id": "team_id",
        "fifaCode": "17",
        "name": "England",
        "nameHebrew": "אנגליה"
      }
    }
  ]
}
```

---

### Matches API (Enhanced)

#### `GET /api/matches`
קבלת משחקים עם פילטרים משופרים

**Query Parameters:**
- `stage` (optional): שלב הטורניר (GROUP, R32, R16, QF, SF, F)
- `group` (optional): אות קבוצה (A-L) - רק עבור GROUP stage
- `upcoming` (optional): `true` להצגת משחקים קרובים בלבד
- `limit` (optional): מספר מקסימלי של תוצאות

**Examples:**
```
GET /api/matches?stage=GROUP&group=A
GET /api/matches?upcoming=true&limit=5
GET /api/matches?stage=R16
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "match_cuid",
      "matchNumber": 1,
      "stage": "GROUP",
      "team1Code": "1A",
      "team2Code": "2A",
      "team1Id": "team_id_1",
      "team2Id": "team_id_2",
      "team1Score": null,
      "team2Score": null,
      "winnerId": null,
      "isFinished": false,
      "scheduledAt": "2026-06-11T18:00:00Z",
      "venue": "Estadio Azteca",
      "team1": {
        "id": "team_id_1",
        "name": "Mexico",
        "groupLetter": "A"
      },
      "team2": {
        "id": "team_id_2",
        "name": "Canada",
        "groupLetter": "A"
      }
    }
  ]
}
```

---

### Predictions API

כל ה-endpoints דורשים authentication (Clerk JWT).

#### `POST /api/predictions/matches`
יצירה/עדכון של ניבויים למשחקים

**Request Body:**
```json
{
  "predictions": [
    {
      "matchId": "match_cuid_1",
      "predScoreA": 2,
      "predScoreB": 1
    },
    {
      "matchId": "match_cuid_2",
      "predScoreA": 0,
      "predScoreB": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Match predictions saved successfully",
    "count": 2
  }
}
```

**Validation:**
- כל ה-matchIds חייבים להתקיים במערכת
- הטופס לא יכול להיות נעול (isFinal = false)
- Outcome מחושב אוטומטית מהציונים

---

#### `POST /api/predictions/advances`
יצירה/עדכון של ניבויים להעפלה לשלבים

**Request Body:**
```json
{
  "predictions": [
    {
      "stage": "F",
      "teamId": "team_id_france"
    },
    {
      "stage": "F",
      "teamId": "team_id_brazil"
    },
    {
      "stage": "SF",
      "teamId": "team_id_argentina"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Advance predictions saved successfully",
    "count": 3
  }
}
```

**Validation:**
- כל ה-teamIds חייבים להתקיים במערכת
- Stage לא יכול להיות GROUP
- הטופס לא יכול להיות נעול

---

#### `POST /api/predictions/top-scorer`
יצירה/עדכון של ניבוי מלך שערים

**Request Body:**
```json
{
  "playerName": "Kylian Mbappé"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Top scorer prediction saved successfully",
    "playerName": "Kylian Mbappé"
  }
}
```

---

#### `GET /api/predictions/my`
קבלת כל הניבויים של המשתמש המחובר

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "form_cuid",
    "ownerId": "user_id",
    "nickname": "Idan #2",
    "submittedAt": "2026-06-10T12:00:00Z",
    "isFinal": false,
    "totalPoints": 42,
    "matchPicks": [
      {
        "matchId": "match_cuid",
        "predScoreA": 2,
        "predScoreB": 1,
        "predOutcome": "W",
        "match": {
          "matchNumber": 1,
          "stage": "GROUP",
          "team1": { "name": "Mexico" },
          "team2": { "name": "Canada" }
        }
      }
    ],
    "advancePicks": [
      {
        "stage": "F",
        "teamId": "team_id",
        "team": {
          "name": "France"
        }
      }
    ],
    "topScorerPicks": [
      {
        "playerName": "Kylian Mbappé"
      }
    ]
  }
}
```

---

## Error Responses

כל ה-endpoints מחזירים שגיאות בפורמט אחיד:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ]
}
```

### Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid JWT)
- `403` - Forbidden (form locked, no permission)
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Testing with cURL

### Get standings for all groups:
```bash
curl http://localhost:3000/api/standings
```

### Get standings for groups A and B:
```bash
curl "http://localhost:3000/api/standings?group=A&group=B"
```

### Get standings for group A only:
```bash
curl http://localhost:3000/api/standings/A
```

### Get upcoming matches:
```bash
curl "http://localhost:3000/api/matches?upcoming=true&limit=5"
```

### Create match predictions:
```bash
curl -X POST http://localhost:3000/api/predictions/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "predictions": [
      {
        "matchId": "match_id_here",
        "predScoreA": 2,
        "predScoreB": 1
      }
    ]
  }'
```

### Get my predictions:
```bash
curl http://localhost:3000/api/predictions/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

1. **Authentication**: 
   - Standings ו-Matches הם public (לא דורשים auth)
   - Predictions דורשים Clerk JWT token

2. **Form Locking**:
   - טפסים ננעלים 30 דקות לפני תחילת הטורניר
   - אי אפשר לשנות ניבויים אחרי שהטופס נעול

3. **Validation**:
   - Outcome מחושב אוטומטית מהציונים
   - כל ה-IDs (match, team) מאומתים מול הדאטהבייס

4. **Performance**:
   - Standings ממוינות לפי: נקודות → הפרש שערים → שערים
   - Matches ממוינות לפי תאריך


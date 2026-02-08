# 🛡️ System för Automatiserad Regressionstestning (Parser Guardrails)

Detta system säkerställer att framtida förbättringar av AI-tolken inte råkar förstöra (regressera) stöd för kvitton som redan fungerar perfekt.

## 1. Vad har lagts till?
Fyra huvudkomponenter har implementerats:

1.  **Golden Set-registret (`test-receipts/golden-set/`)**: En dedikerad mapp för "Gyllene kvitton" – kända exempel som parsern alltid måste hantera korrekt.
2.  **Testköraren (`scripts/test-parser-regression.ts`)**: Ett skript som automatiserar testprocessen. Det laddar upp PDF-filer till Supabase, anropar `parse-receipt`-funktionen och jämför resultatet mot förväntade värden.
3.  **CI/CD-arbetsflöde (`.github/workflows/parser-regression-test.yml`)**: En GitHub Action som kör dessa tester automatiskt varje natt kl. 02:00 UTC och vid varje pull request som rör parser-koden.
4.  **CLI-kommando**: `npm run test:regression` har lagts till i `package.json` för enkel åtkomst för utvecklare.

## 2. Syftet med `ICA_Kvantum_Example.pdf`
Denna fil fungerar som en **baslinje (Source of Truth)**.

*   **Problemet**: Logiken i `parse-receipt` är komplex. En fix för ett kvitto från Willys kan av misstag bryta logiken för ICA-kvitton.
*   **Användningsfall**: Just denna PDF innehåller exakt **45 artiklar** och en totalsumma på **1353,53 kr**.
*   **Skyddsvallen**: Om du ändrar koden och parsern plötsligt bara hittar 44 artiklar eller räknar ut en annan summa för just denna fil, kommer testet att misslyckas direkt. Detta varnar dig för att din ändring har orsakat ett fel någon annanstans.

## 3. Instruktioner

### Köra tester lokalt
Innan du pushar ändringar till parsern bör du köra testerna för att säkerställa att allt fungerar:
```bash
# Se till att din .env har SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY
npm run test:regression
```

### Lägga till ett nytt "Golden" kvitto
När du fixar en bugg i parsern eller hittar ett kvitto som tolkas perfekt bör du lägga till det i testerna:

1.  **Spara PDF:en**: Lägg kvitto-PDF:en i `test-receipts/golden-set/`.
2.  **Uppdatera indexet**: Lägg till ett objekt i `test-receipts/golden-set/golden-set-index.json`:
    ```json
    {
      "id": "nytt-butik-exempel",
      "store_type": "Willys",
      "pdf_file": "Willys_2026_02_08.pdf",
      "items_count": 12,        // Exakt antal artiklar på kvittot
      "total_amount": 450.50    // Exakt totalsumma
    }
    ```
3.  **Commit**: Pusha både PDF-filen och den uppdaterade JSON-filen till GitHub.

### Övervakning i CI
*   **GitHub Actions**: Gå till fliken **Actions** i ditt repository och välj **Parser Regression Test**.
*   **Misslyckade tester**: Om ett test misslyckas visas exakt vad som blev fel (t.ex. `Items count mismatch: expected 45, got 42`).
*   **Notera**: `continue-on-error: true` är för tillfället aktiverat i arbetsflödet. Det betyder att kontrollen visar en **varning (orange)** istället för ett **fel (röd)** om Edge Functionen är instabil, vilket tillåter merge men ändå visar resultatet.

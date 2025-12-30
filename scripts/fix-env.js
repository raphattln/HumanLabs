
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Regex to match Supabase pooler URL
    // Matches: postgresql://[user].[project]:[pass]@[host]:6543/[db]?pgbouncer=true
    // We want to capture [pass] and [project] (if needed, but we can infer project from user)

    // Looking at: postgresql://postgres.tbjhhodzasyhhkwdiwwa:****@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

    const regex = /DATABASE_URL="?postgresql:\/\/postgres\.([a-z0-9]+):([^@]+)@([^:]+):6543\/postgres\?pgbouncer=true"?/g;

    const match = regex.exec(envContent);

    if (match) {
        const projectRef = match[1];
        const password = match[2];
        const oldHost = match[3];

        console.log(`Found Project Ref: ${projectRef}`);
        console.log(`Found Host: ${oldHost}`);

        // Construct Direct URL
        // postgresql://postgres:[password]@db.[projectRef].supabase.co:5432/postgres

        const newUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

        // Replace in content (handling potential quotes)
        const newEnvContent = envContent.replace(
            /DATABASE_URL=.*/,
            `DATABASE_URL="${newUrl}"`
        );

        fs.writeFileSync(envPath, newEnvContent);
        console.log('✅ .env updated successfully to Direct Connection');
        console.log(`New URL format: postgresql://postgres:****@db.${projectRef}.supabase.co:5432/postgres`);
    } else {
        // Try alternate format or check if already direct?
        // Maybe verify if it's already 5432
        if (envContent.includes(':5432')) {
            console.log('⚠️  It seems DATABASE_URL is already using port 5432. No changes made.');
        } else {
            console.error('❌ Could not parse DATABASE_URL matching expected Supabase Pooler pattern.');
            // print a masked version of what we found for debugging
            const currentLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL'));
            if (currentLine) {
                console.log('Current line (masked):', currentLine.replace(/:[^:@]+@/, ':****@'));
            }
        }
    }
} catch (err) {
    console.error('Error processing .env:', err);
}

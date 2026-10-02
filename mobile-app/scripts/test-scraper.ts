import "dotenv/config";
import { scrapeSupplyChainNews } from "../server/services/news_scraper";

async function test() {
    console.log("Testing News Scraper...");
        const args = process.argv.slice(2);
        const dryRun = args.includes("--dry-run") || process.env.SCRAPER_DRY_RUN === "1";

        const limitArg = args.find(arg => arg.startsWith("--limit="));
        const parsedLimit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
        const limit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;

        const rssArg = args.find(arg => arg.startsWith("--rss="));
        const rssUrl = rssArg ? rssArg.split("=")[1] : undefined;
    try {
            const result = await scrapeSupplyChainNews({ dryRun, limit, rssUrl });
            console.log(`✅ Scraper Success (${dryRun ? "dry run" : "persisted"}):`, JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("❌ Scraper Failed:", error);
        process.exit(1);
    }
}

test();

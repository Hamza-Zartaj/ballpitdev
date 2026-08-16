import searchController from "../../controllers/searchController";

export const GET = async (req) => {
    const url = new URL(req.url);
    const key = url.searchParams.get('name');
    try {
        const search = await searchController.search(key);
        return new Response(JSON.stringify(search), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 404 });
    }
};
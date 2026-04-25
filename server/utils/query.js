const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parsePagination = (query = {}) => {
    const rawPage = query.page;
    const rawLimit = query.limit;

    if (rawPage === undefined && rawLimit === undefined) {
        return {
            enabled: false,
            page: DEFAULT_PAGE,
            limit: DEFAULT_LIMIT,
            skip: 0
        };
    }

    const page = Math.max(DEFAULT_PAGE, Number.parseInt(rawPage || DEFAULT_PAGE, 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(rawLimit || DEFAULT_LIMIT, 10)));

    return {
        enabled: true,
        page,
        limit,
        skip: (page - 1) * limit
    };
};

module.exports = { parsePagination };

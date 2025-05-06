export const getCTProductsForSitemapQuery = () => {
    const CTProducts = `
		query getCTProducts($limit: Int, $offset: Int, $sort: [String!]) {
			products(limit: $limit, offset: $offset, sort: $sort) {
				offset
				count
				total
				exists
				results {
				masterData {
					current {
					name(locale: "en-AU")
					slug(locale: "en-AU")
					masterVariant {
						prices {
						id
						value {
							centAmount
						}
						}
						attributesRaw(
						includeNames: ["CTProductUrlComponent", "isInactive", "isDisplay"]
						) {
						name
						value
						}
					}
					}
				}
				lastModifiedAt
				}
			}
		}
		`;
    return CTProducts;
};

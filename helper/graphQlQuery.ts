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

export const getCTCategoriesForSitemapQuery = () => {
	const CTCategories = `
    query getCTCategories($limit: Int, $offset: Int) {
      categories(limit: $limit, offset: $offset) {
        offset
        count
        total
        exists
        results {
		  id
		  name(locale: "en-AU")
		  key
          lastModifiedAt
          custom {
            customFieldsRaw(includeNames: ["seoUrl", "Display"]) {
              name
              value
            }
          }
        }
      }
    }
	`;
	return CTCategories;
};

export const getProductCountByCategoryQuery = () => {
	const productCount = `
	query getProductCountByCategory($whereCond: String) {
		products(where: $whereCond) {
			total
			results {
			masterData {
				current {
				categories {
					id
					name(locale: "en-AU")
				}
				}
			}
			}
		}
	}
  `;
	return productCount;
}
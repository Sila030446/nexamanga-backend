export const MANGA_INDEX = 'manga_manhwa';

export const mangaIndexConfig = {
  mappings: {
    properties: {
      id: { type: 'integer' },
      title: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          completion: { type: 'completion' },
        },
      },
      alternativeTitle: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
        },
      },
      description: { type: 'text' },
    },
  },
};

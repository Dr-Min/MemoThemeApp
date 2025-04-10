declare module 'tiny-tfidf-node' {
  export default class TfIdf {
    addDocument(doc: string, id: string): void;
    removeDocument(id: string): void;
    getSimilarDocuments(id: string, numResults: number): Array<{id: string, similarity: number}>;
  }
} 
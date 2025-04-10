import * as SQLite from 'expo-sqlite';
import { Memo } from '../../models/Memo';
import { Theme } from '../../models/Theme';

/**
 * SQLite 데이터베이스 서비스
 * AsyncStorage 대신 사용할 수 있는 구조화된 데이터 저장소
 */
export class DatabaseService {
  private static db: SQLite.SQLiteDatabase;
  private static isInitialized = false;

  /**
   * 데이터베이스 초기화
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.db = SQLite.openDatabase('memo_theme_app.db');
      
      // 테이블 생성
      await this.createTables();
      
      this.isInitialized = true;
      console.log('데이터베이스가 성공적으로 초기화되었습니다.');
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 테이블 생성
   */
  private static async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // 메모 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS memos (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('메모 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS themes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_theme TEXT,
            description TEXT
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('테마 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 메모-테마 관계 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS memo_themes (
            memo_id TEXT,
            theme_id TEXT,
            PRIMARY KEY (memo_id, theme_id),
            FOREIGN KEY (memo_id) REFERENCES memos (id) ON DELETE CASCADE,
            FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('메모-테마 관계 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 키워드 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS theme_keywords (
            theme_id TEXT,
            keyword TEXT,
            PRIMARY KEY (theme_id, keyword),
            FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('테마 키워드 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 자식 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS theme_children (
            parent_id TEXT,
            child_id TEXT,
            PRIMARY KEY (parent_id, child_id),
            FOREIGN KEY (parent_id) REFERENCES themes (id) ON DELETE CASCADE,
            FOREIGN KEY (child_id) REFERENCES themes (id) ON DELETE CASCADE
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('테마 자식 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 사용자 패턴 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS user_patterns (
            word TEXT,
            theme_id TEXT,
            count INTEGER DEFAULT 1,
            PRIMARY KEY (word, theme_id),
            FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('사용자 패턴 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 자주 사용되는 단어 테이블
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS frequent_terms (
            term TEXT PRIMARY KEY,
            count INTEGER DEFAULT 1
          )`,
          [],
          () => {},
          (_, error) => { 
            console.error('자주 사용되는 단어 테이블 생성 실패:', error);
            reject(error);
            return false;
          }
        );
      }, error => {
        console.error('테이블 생성 트랜잭션 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }

  /**
   * 모든 메모 가져오기
   */
  static async getAllMemos(): Promise<Memo[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const memos: Memo[] = [];
      
      this.db.transaction(tx => {
        // 메모 조회
        tx.executeSql(
          'SELECT * FROM memos ORDER BY created_at DESC',
          [],
          (_, result) => {
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const memoRow = rows.item(i);
              
              // 메모 객체 생성
              const memo: Memo = {
                id: memoRow.id,
                content: memoRow.content,
                themes: [], // 메모에 연결된 테마 목록 (아래에서 채울 예정)
                createdAt: new Date(memoRow.created_at),
                updatedAt: new Date(memoRow.updated_at)
              };
              
              memos.push(memo);
            }
          },
          (_, error) => {
            console.error('메모 조회 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 각 메모에 연결된 테마 ID 가져오기
        tx.executeSql(
          'SELECT memo_id, theme_id FROM memo_themes',
          [],
          (_, result) => {
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const memo = memos.find(m => m.id === row.memo_id);
              
              if (memo) {
                memo.themes.push(row.theme_id);
              }
            }
            
            resolve(memos);
          },
          (_, error) => {
            console.error('메모-테마 관계 조회 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 모든 테마 가져오기
   */
  static async getAllThemes(): Promise<Theme[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const themes: Theme[] = [];
      
      this.db.transaction(tx => {
        // 테마 정보 조회
        tx.executeSql(
          'SELECT * FROM themes',
          [],
          (_, result) => {
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const themeRow = rows.item(i);
              
              // 테마 객체 생성
              const theme: Theme = {
                id: themeRow.id,
                name: themeRow.name,
                parentTheme: themeRow.parent_theme,
                keywords: [], // 아래에서 채울 예정
                childThemes: [], // 아래에서 채울 예정
                description: themeRow.description
              };
              
              themes.push(theme);
            }
          },
          (_, error) => {
            console.error('테마 조회 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 키워드 가져오기
        tx.executeSql(
          'SELECT theme_id, keyword FROM theme_keywords',
          [],
          (_, result) => {
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const theme = themes.find(t => t.id === row.theme_id);
              
              if (theme) {
                theme.keywords.push(row.keyword);
              }
            }
          },
          (_, error) => {
            console.error('테마 키워드 조회 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 자식 관계 가져오기
        tx.executeSql(
          'SELECT parent_id, child_id FROM theme_children',
          [],
          (_, result) => {
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const theme = themes.find(t => t.id === row.parent_id);
              
              if (theme) {
                theme.childThemes.push(row.child_id);
              }
            }
            
            resolve(themes);
          },
          (_, error) => {
            console.error('테마 자식 관계 조회 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 메모 저장하기
   */
  static async saveMemo(memo: Memo): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // 메모 저장/업데이트
        tx.executeSql(
          `INSERT OR REPLACE INTO memos (id, content, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
          [
            memo.id,
            memo.content,
            memo.createdAt.toISOString(),
            memo.updatedAt.toISOString()
          ],
          () => {},
          (_, error) => {
            console.error('메모 저장 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 기존 메모-테마 관계 삭제
        tx.executeSql(
          'DELETE FROM memo_themes WHERE memo_id = ?',
          [memo.id],
          () => {},
          (_, error) => {
            console.error('메모-테마 관계 삭제 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 메모-테마 관계 저장
        for (const themeId of memo.themes) {
          tx.executeSql(
            'INSERT INTO memo_themes (memo_id, theme_id) VALUES (?, ?)',
            [memo.id, themeId],
            () => {},
            (_, error) => {
              console.error('메모-테마 관계 저장 실패:', error);
              reject(error);
              return false;
            }
          );
        }
      }, error => {
        console.error('메모 저장 트랜잭션 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }

  /**
   * 테마 저장하기
   */
  static async saveTheme(theme: Theme): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // 테마 저장/업데이트
        tx.executeSql(
          `INSERT OR REPLACE INTO themes (id, name, parent_theme, description)
           VALUES (?, ?, ?, ?)`,
          [
            theme.id,
            theme.name,
            theme.parentTheme,
            theme.description || ''
          ],
          () => {},
          (_, error) => {
            console.error('테마 저장 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 기존 테마 키워드 삭제
        tx.executeSql(
          'DELETE FROM theme_keywords WHERE theme_id = ?',
          [theme.id],
          () => {},
          (_, error) => {
            console.error('테마 키워드 삭제 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 키워드 저장
        for (const keyword of theme.keywords) {
          tx.executeSql(
            'INSERT INTO theme_keywords (theme_id, keyword) VALUES (?, ?)',
            [theme.id, keyword],
            () => {},
            (_, error) => {
              console.error('테마 키워드 저장 실패:', error);
              reject(error);
              return false;
            }
          );
        }
        
        // 기존 테마 자식 관계 삭제
        tx.executeSql(
          'DELETE FROM theme_children WHERE parent_id = ?',
          [theme.id],
          () => {},
          (_, error) => {
            console.error('테마 자식 관계 삭제 실패:', error);
            reject(error);
            return false;
          }
        );
        
        // 테마 자식 관계 저장
        for (const childId of theme.childThemes) {
          tx.executeSql(
            'INSERT INTO theme_children (parent_id, child_id) VALUES (?, ?)',
            [theme.id, childId],
            () => {},
            (_, error) => {
              console.error('테마 자식 관계 저장 실패:', error);
              reject(error);
              return false;
            }
          );
        }
      }, error => {
        console.error('테마 저장 트랜잭션 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }

  /**
   * 메모 삭제하기
   */
  static async deleteMemo(memoId: string): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // 메모 삭제 (연관 테이블 데이터는 CASCADE로 자동 삭제됨)
        tx.executeSql(
          'DELETE FROM memos WHERE id = ?',
          [memoId],
          () => {},
          (_, error) => {
            console.error('메모 삭제 실패:', error);
            reject(error);
            return false;
          }
        );
      }, error => {
        console.error('메모 삭제 트랜잭션 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }

  /**
   * 테마 삭제하기
   */
  static async deleteTheme(themeId: string): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // 테마 삭제 (연관 테이블 데이터는 CASCADE로 자동 삭제됨)
        tx.executeSql(
          'DELETE FROM themes WHERE id = ?',
          [themeId],
          () => {},
          (_, error) => {
            console.error('테마 삭제 실패:', error);
            reject(error);
            return false;
          }
        );
      }, error => {
        console.error('테마 삭제 트랜잭션 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }

  /**
   * 사용자 패턴 가져오기
   */
  static async getUserPatterns(): Promise<{ word: string; themeId: string; count: number }[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT word, theme_id, count FROM user_patterns',
          [],
          (_, result) => {
            const patterns = [];
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              patterns.push({
                word: row.word,
                themeId: row.theme_id,
                count: row.count
              });
            }
            
            resolve(patterns);
          },
          (_, error) => {
            console.error('사용자 패턴 조회 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 자주 사용되는 단어 가져오기
   */
  static async getFrequentTerms(): Promise<{ term: string; count: number }[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT term, count FROM frequent_terms ORDER BY count DESC LIMIT 100',
          [],
          (_, result) => {
            const terms = [];
            const rows = result.rows;
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              terms.push({
                term: row.term,
                count: row.count
              });
            }
            
            resolve(terms);
          },
          (_, error) => {
            console.error('자주 사용되는 단어 조회 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 사용자 패턴 업데이트
   */
  static async updateWordThemePattern(word: string, themeId: string): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO user_patterns (word, theme_id, count) 
           VALUES (?, ?, 1)
           ON CONFLICT(word, theme_id) DO UPDATE SET count = count + 1`,
          [word, themeId],
          () => {
            resolve();
          },
          (_, error) => {
            console.error('사용자 패턴 업데이트 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 단어 빈도 업데이트
   */
  static async updateTermFrequency(term: string): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO frequent_terms (term, count) 
           VALUES (?, 1)
           ON CONFLICT(term) DO UPDATE SET count = count + 1`,
          [term],
          () => {
            resolve();
          },
          (_, error) => {
            console.error('단어 빈도 업데이트 실패:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * 데이터베이스 초기화 (모든 데이터 삭제)
   */
  static async resetDatabase(): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql('DELETE FROM memos', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM themes', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM memo_themes', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM theme_keywords', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM theme_children', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM user_patterns', [], () => {}, (_, error) => { reject(error); return false; });
        tx.executeSql('DELETE FROM frequent_terms', [], () => {}, (_, error) => { reject(error); return false; });
      }, error => {
        console.error('데이터베이스 초기화 실패:', error);
        reject(error);
      }, () => {
        resolve();
      });
    });
  }
} 
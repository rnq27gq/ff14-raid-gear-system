export class MockSupabaseClient {
    constructor() {
        this.mockResponses = new Map();
        this.mockErrors = new Map();
    }
    
    setMockResponse(table, operation, response) {
        const key = `${table}:${operation}`;
        this.mockResponses.set(key, response);
    }
    
    setMockError(table, operation, error) {
        const key = `${table}:${operation}`;
        this.mockErrors.set(key, error);
    }
    
    from(table) {
        return new MockTable(table, this.mockResponses, this.mockErrors);
    }
    
    rpc(functionName, params) {
        const key = `rpc:${functionName}`;
        const error = this.mockErrors.get(key);
        const data = this.mockResponses.get(key);
        
        return Promise.resolve({
            data: error ? null : data,
            error: error || null
        });
    }
}

class MockTable {
    constructor(tableName, mockResponses, mockErrors) {
        this.tableName = tableName;
        this.mockResponses = mockResponses;
        this.mockErrors = mockErrors;
        this.operations = [];
    }
    
    insert(data) {
        this.operations.push({ type: 'insert', data });
        return this._createResponse('insert');
    }
    
    select(columns = '*') {
        this.operations.push({ type: 'select', columns });
        return this._createResponse('select');
    }
    
    eq(column, value) {
        this.operations.push({ type: 'eq', column, value });
        return this;
    }
    
    single() {
        this.operations.push({ type: 'single' });
        return this._createResponse('select');
    }
    
    _createResponse(operation) {
        const key = `${this.tableName}:${operation}`;
        const error = this.mockErrors.get(key);
        const data = this.mockResponses.get(key);
        
        return Promise.resolve({
            data: error ? null : (data?.data || data),
            error: error || null
        });
    }
}
// Mock for next/server
class NextRequest {
  constructor(input, init) {
    this.url = input || 'https://example.com';
    this.init = init || {};
    this._body = null;
  }

  // Add any NextRequest methods that are used in your tests
  async json() {
    return this._body;
  }

  set _body(body) {
    this.__body = body;
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.init = init;
    this.headers = init.headers || {};
    this.status = init.status || 200;
  }

  static json(data) {
    return new NextResponse(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

const cookies = () => {
  return {
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };
};

const headers = () => {
  return {
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };
};

module.exports = {
  NextRequest,
  NextResponse,
  cookies,
  headers
};

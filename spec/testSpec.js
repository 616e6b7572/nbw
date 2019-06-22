const {BaseExec, Exec, Boot, Install, Init, NPM, CLI} = require('../src/index.js');

describe('test', function() {
	it('testing GenCls', function() {
		var c = new BaseExec();
		c = c.getConsole();
		expect(c.log('testing console')).toBe(undefined);
	});
});

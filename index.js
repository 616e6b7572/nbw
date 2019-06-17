'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const SDIR = os.homedir()+'/.g_node_modules';

class BaseExec{
	constructor(){
		
	}
	execute(cmd){
		exec(cmd, (error, stdout, stderr) => {
		  if (error) {
			console.error(`exec error: ${error}`);
			return;
		  }
		  console.log(`${stdout}`);
		  console.log(`${stderr}`);
		});
	}
	execFile(cmd, args){
		const execFile = util.promisify(require('child_process').execFile);
		async function getVersion(cmd, args) {
		const { stdout } = await execFile(cmd, args, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return;
			}
			console.log(`${stdout}`);
			console.log(`${stderr}`);
		}).catch((e) => {console.log(e)});
			console.log(stdout);
		} 
		getVersion(cmd, args);	
	}
	fork(cmd, args){
		const cp = require('child_process');
		const n = cp.fork(cmd, args);
	}
}

class Exec extends BaseExec{
	constructor(){
		super();
		try{
			var s = fs.openSync('./package.json', 'r');
			try{
				var s = fs.openSync('cd '+SDIR, 'r');
			}
			catch(e){
				Boot.execute();
			}
		}
		catch(e){
			process.stdout.write(`ERROR: File "package.json" not available.\n Try: npm init [-f|--force|-y|--yes] \n`);
			process.exit();
		}
	}
}

class Boot extends Exec{
	constructor(){
		super();	
	}
	static getNPM(){
		var path = process.env.PATH.split(':');
		var npm = '';
		var i = 0;
		for(i in path){
			var val = path[i]+'/npm';
			try{
				fs.openSync(val, 'r');
				npm = val;
				break;
			}
			catch(e){
				
			}
		}
		if(npm == ''){
			process.stdout.write(`ERROR: Unable  to find "npm", Please make sure it's in your ENV PATH. \n`);
			process.exit();	
		}
		return npm;
	}
	static execute(){
		fs.stat(SDIR, (err, stats) => {
			if (err){
				if(err.code == 'ENOENT'){
					fs.mkdir(SDIR, (err) => {
						if (err) throw err;
						fs.stat(SDIR+'/node_modules', (err, stats) => {
							if (err){
								if(err.code == 'ENOENT'){
									fs.mkdir(SDIR+'/node_modules', (err) => {
									if (err) throw err;

									});
								}
							}
						});
					
						fs.writeFile(SDIR+'/package.json'
							, '{\n"name": "g_node_modules",\n"version": "1.0.0",\n"description": "npm",\n"main": "index.js",\n"scripts": {\n\t"test": "echo \\"Error: no test specified\\" && exit 1"\n},\n"repository": {\n\t"type": "git",\n\t"url": "git+https://github.com/"\n},\n"keywords": [],\n"author": "",\n"license": "ISC"\n}'
							, 'utf8', 
							function(err){if(err) throw err;}
						);
					
						fs.writeFile(SDIR+'/index.js'
							,''
							, 'utf8', 
							function(err){if(err) throw err;}
						);
					});
				}  
			}
		});
	}
}

class Install extends Exec{
	constructor(argv){
		super();
		this.argv = argv;		
	}
	execute(){
		super.execute('cd '+SDIR+' && npm '+this.argv.join(' '));
		//super.execute('npm ');
	}
}

class Init extends BaseExec{
	constructor(argv){
		super();
		this.argv = argv;
	}
	execute(){
		var npm = Boot.getNPM();
		super.fork(`${npm}`, this.argv);
		fs.symlinkSync(SDIR, 'node_modules');
	}
}

class NPM extends Exec{
	constructor(argv){
		super();
		this.argv = argv;
	}
	execute(){
		var npm = Boot.getNPM();
		super.fork(`${npm}`, this.argv);
	}
}

const CLI = function(){
	var argv = [];
	process.argv.forEach((val, index) => {
	  if(index > 1){argv.push(val);}
	});
	this.boot = function(){		
		//Boot.execute();
	}
	this.install = function(argv){
		var install = new Install(argv); 
		install.execute();
	}
	this.init = function(argv){
		var init = new Init(argv); 
		init.execute();
	}
	this.npm = function(argv){
		var npm = new NPM(argv); 
		npm.execute();
	}
	this.execute = function(){
		this.boot();
		if(this[argv[0]] != undefined){
			this[argv[0]](argv);
		}
		else{
			this.npm(argv);
		}
	};
}

const nbw = function(){
	var cli = new CLI();
	cli.execute();
};

module.exports = nbw;

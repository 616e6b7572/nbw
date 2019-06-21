'use strict';
const fs = require('fs');
const os = require('os');
const PATH = require('path');
const { execSync } = require('child_process');
const { exec } = require('child_process');
const util = require('util');
const SDIR = os.homedir()+'/.nbw';

function getProcess(){
	// eslint-disable-next-line no-undef
	return process;
}

function getConsole(){
	// eslint-disable-next-line complexity
	return console;
}


class BaseExec{
	constructor(){
		
	}
	execute(cmd){
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				getConsole().error(`exec error: ${error}`);
				return;
			}
			getProcess().stdout.write(`${stdout}`);
			getConsole().error(`${stderr}`);
		});
	}
	executeSync(cmd){
		var r = execSync(cmd);
		getConsole().log(r.toString('utf8'));
	}
	execFile(cmd, args){
		const execFile = util.promisify(require('child_process').execFile);
		async function getVersion(cmd, args) {
			const { stdout } = await execFile(cmd, args, (error, stdout, stderr) => {
				if (error) {
					getConsole().error(`exec error: ${error}`);
					return;
				}
				stdout = stdout.replace('npm', 'nbw');
				stderr = stderr.replace('npm', 'nbw');
				getProcess().stdout.write(`${stdout}`);
				getConsole().error(`${stderr}`);
			}).catch((e) => {getProcess().stdout.write(e);});
			getProcess().stdout.write(stdout);
		} 
		getVersion(cmd, args);	
	}
	fork(cmd, args){
		const cp = require('child_getProcess()');
		const n = cp.fork(cmd, args);
		return n;
	}
}

class Exec extends BaseExec{
	constructor(){
		super();
		try{
			fs.openSync('./package.json', 'r');
			try{
				fs.openSync('cd '+SDIR, 'r');
			}
			catch(e){
				Boot.execute();
			}
		}
		catch(e){
			getProcess().stdout.write('ERROR: File "package.json" not available.\n Try: npm init [-f|--force|-y|--yes] \n');
			getProcess().exit();
		}
	}
}

class Boot extends BaseExec{
	constructor(){
		super();	
	}
	static getNPM(){
		var path = getProcess().env.PATH.split(':');
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
				getProcess().stdout.write(`${e}`);
			}
		}
		if(npm == ''){
			getProcess().stdout.write('ERROR: Unable  to find "npm", Please make sure it\'s in your ENV PATH. \n');
			getProcess().exit();	
		}
		return npm;
	}
	static execute(){
		try{
			fs.statSync(SDIR);
			try{
				fs.statSync('./node_modules');
			}
			catch(err){
				if(err.code == 'ENOENT'){
					fs.symlinkSync(SDIR+'/node_modules', 'node_modules');
				}
			}
		}
		catch(err){
			if(err.code == 'ENOENT'){
				try{
					fs.mkdirSync(SDIR);
					fs.mkdirSync(SDIR+'/node_modules');
					fs.symlinkSync(SDIR+'/node_modules', 'node_modules');

					fs.writeFile(SDIR+'/package.json'
						, '{\n"name": "_nbw",\n"version": "1.0.0",\n"description": "npm",\n"main": "index.js",\n"scripts": {\n\t"test": "echo \\"Error: no test specified\\" && exit 1"\n},\n"repository": {\n\t"type": "git",\n\t"url": "git+https://github.com/"\n},\n"keywords": [],\n"author": "",\n"license": "ISC"\n}'
						, 'utf8', 
						function(err){if(err) throw err;}
					);
				
					fs.writeFile(SDIR+'/index.js'
						,''
						, 'utf8', 
						function(err){if(err) throw err;}
					);
				}
				catch(e){
					getProcess().stdout.write('ERROR: Unable to create global node_modules folder. Please try again! \n');
					getProcess().exit();
				}	
			}
		}
	}
}

class Install extends Exec{
	constructor(argv){
		super();
		this.argv = argv;		
	}
	execute(){
		Boot.execute();
		
		var flags = [];
		var cmd = [];
		
		for(let i in this.argv){
			if(this.argv[i].search('-') > -1){
				flags.push(this.argv[i]);
			}
			else{
				cmd.push(this.argv[i]);
			}
		}
		
		super.executeSync('cd '+SDIR+' && npm '+this.argv.join(' '));
		
		this.postInstall(flags, cmd);
		
		//super.execute('npm ');
	}
	postInstall(flags, cmd){
		cmd.shift();
		var t = cmd.shift();
		t = PATH.basename(t);
		fs.readFile('./node_modules/'+t+'/package.json', 'utf8', (err, data) => {
			if (err){
				getProcess().stdout.write(`${err}`);
				getProcess().exit();
			} else {
				data = JSON.parse(data);
				var dep =[t, '^'+data.version];
				fs.readFile('./package.json', 'utf8', (err, data) => {
					if (err){
						getProcess().stdout.write(`${err}`);
						getProcess().exit();
					} else {
						for(let i=0; i<flags.length;i++){
							data = JSON.parse(data);
							if(flags[i] == '--save'){
								if(data.dependencies == undefined){
									data['dependencies'] = {};
								}
								data.dependencies[dep[0]] = dep[1]; 
							}
							else if(flags[i] == '--save-dev'){
								if(data.devDependencies == undefined){
									data['devDependencies'] = {};
								}
								data.devDependencies[dep[0]] = dep[1]; 
							}
							else if(flags[i] == '--save-optional'){
								if(data.optionalDependencies == undefined){
									data['optionalDependencies'] = {};
								}
								data.optionalDependencies[dep[0]] = dep[1];
							}
							data = JSON.stringify(data, null, 2);
							fs.writeFile('./package.json', data, 'utf8',(err) => {
								if(err){
									getProcess().stdout.write(`${err}`);
									getProcess().exit();
								}
							});
						}
					}
				});
			}
		});
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
	}
}

class NPM extends BaseExec{
	constructor(argv){
		super();
		this.argv = argv;
	}
	execute(){
		var cmd = 'npm';
		var args = this.argv;
		if(args.length < 1){args.push('help');}
		super.execFile(cmd, args);
	}
}

const CLI = function(){
	var argv = [];
	getProcess().argv.forEach((val, index) => {
		if(index > 1){argv.push(val);}
	});
	this.install = function(argv){
		var install = new Install(argv); 
		install.execute();
	};
	this.i = function(argv){
		var install = new Install(argv); 
		install.execute();
	};
	this.init = function(argv){
		var init = new Init(argv); 
		init.execute();
	};
	this.npm = function(argv){
		var npm = new NPM(argv); 
		npm.execute();
	};
	this.execute = function(){
		if(this[argv[0]] != undefined){
			this[argv[0]](argv);
		}
		else{
			this.npm(argv);
		}
	};
};

const nbw = function(){
	var cli = new CLI();
	cli.execute();	
};




module.exports = nbw;

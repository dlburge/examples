/*global module:false*/

module.exports = function(grunt) {
	
	"use strict";
	
	require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);
	
	// Project configuration. 
	grunt.initConfig({
	
		pkg: grunt.file.readJSON('package.json'),
		
		//Concat JS
		concat: {
			/*options: { NOT NEEDED
				// define a string to put between each file in the concatenated output
				separator: ';'
			},*/
			dist: {
				// the files to concatenate
				src: ['app/js/utils.js','app/js/*.js'],
				// the location of the resulting JS file
				dest: 'app/js/dist/<%= pkg.name %>.js'
			}
		},
		
		//Uglify JS
		uglify: {
			options: {
				// the banner is inserted at the top of the output
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'app/js/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},
		
		//JS validatio
		jshint: {
			files: ['Gruntfile.js', 'app/js/*.js'],
			options: {
				curly: true, 
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				browser: true, 
                loopfunc:true,
				globals: { 
					jQuery: true,
					$: true,
					SelogerUI: true,
					Mustache: true,
					History: true,
					console:true,
					alert:true,
					require:true,
                    d3:true,
                    d:true
				}
			}
		},
		
		//CSS
		compass: {
			prod: {
				options: {
					sassDir: 'app/scss',
					cssDir: 'app/css',
					environment: 'production'
				}
			},
			dev: {
				options: {
					sassDir: 'app/scss',
					cssDir: 'app/css'
				}
			}
		},
		
		//Watch command definitions
		watch: {
			compass : { //TODO : this doesn't work /// changes are not detected..
				files: ['app/scss/*.scss'],
				tasks: ['compass:dev', 'compass:prod']
			},
			jshint : {
				files: ['<%= jshint.files %>'],
				tasks: ['jshint', 'concat', 'uglify']
			}
		}
	
	});
	
	// Default task.
	grunt.registerTask('default', ['jshint', 'concat', 'uglify']); // JS only for default task

};
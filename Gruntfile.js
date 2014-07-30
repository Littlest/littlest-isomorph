var fork = require('child_process').fork;

module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      client: {
        src: ['lib/client.js'],
        dest: 'public/bundle.js',
        options: {
          transform: ['reactify']
        }
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js', '**/*.jsx', '!public/bundle.js'],
        tasks: ['browserify'],
        options: {
          atBegin: true
        },
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('server', function () {
    grunt.util.spawn({
      cmd: 'node',
      args: [
        './node_modules/nodemon/bin/nodemon.js',
        'index.js',
        '--ext', 'html,js,jsx'
      ],
      opts: {
        stdio: 'inherit'
      }
    }, function () {
      grunt.fail.fatal(new Error('nodemon quit'));
    });
  });

  grunt.registerTask('default', ['browserify']);
  grunt.registerTask('dev', ['server', 'watch:scripts']);
};

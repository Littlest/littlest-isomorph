var fork = require('child_process').fork;
var path = require('path');

module.exports = function (grunt) {
  grunt.initConfig({
    browserify: {
      client: {
        src: ['bin/client'],
        dest: 'public/bundle.js',
        options: {
          transform: ['envify', 'reactify']
        }
      }
    },
    less: {
      client: {
        src: [
          'node_modules/purecss/pure.css',
          'node_modules/purecss/grids-responsive.css',
          'styles/**/*.less'
        ],
        dest: 'public/bundle.css',
        options: {
          paths: function (srcFile) {
            return [
              path.dirname(srcFile),
              path.resolve(__dirname, 'node_modules')
            ];
          },
          relativeUrls: true
        }
      }
    },
    watch: {
      scripts: {
        files: ['bin/client', 'lib/**/*.js', 'lib/**/*.jsx', 'lib/**/*.json'],
        tasks: ['browserify'],
        options: {
          atBegin: true
        }
      },
      styles: {
        files: ['styles/**/*.less'],
        tasks: ['less'],
        options: {
          atBegin: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('server', function () {
    grunt.util.spawn({
      cmd: 'node',
      args: [
        './node_modules/supervisor/lib/cli-wrapper.js',
        '-w', 'public',
        '-e', 'html,js,json',
        'index.js'
      ],
      opts: {
        stdio: 'inherit'
      }
    }, function () {
      grunt.fail.fatal(new Error('Supervisor quit.'));
    });
  });

  grunt.registerTask('default', ['browserify']);
  grunt.registerTask('dev', ['server', 'watch']);
};

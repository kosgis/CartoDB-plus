/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    'gh-pages': {
      options: {
        base: 'dist'
      },
      'run': {
        options: {
          message: 'Auto-generated commit.'
        },
        src: ['**']
      }
    },
    clean: ['dist', 'gh-pages'],
    copy: {
      main: {
        files: [{
          expand: true,
          flatten: false,
          cwd: 'src',
          src: '**',
          dest: 'dist/'
        }
        ]
      }
    }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-gh-pages');

    // Default task.
    grunt.registerTask('default', ['clean','copy','gh-pages:run']);

  };

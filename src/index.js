import path from 'path';
import { runTests } from './utils.js';
import ru from './locales/ru.js';
import { mkdir, mkfile } from '@hexlet/immutable-fs-trees';
import {
  checkStructure,
  checkDependencies,
  checkScripts,
  checkEslintConfig,
  checkEditorConfig,
  checkTrackingFiles,
  checkEslint,
} from './tests.js';

const [, , PROJECT_PATH, LANG = 'ru'] = process.argv;

const app = async (projectPath, lng) => {
  const options = {
    projectPath,
    lang: lng,
    resources: {
      ru
    },
  };

  const check = async () => {
    const tree = mkdir('project', [
      mkdir('backend', [
        mkdir('src', [
          mkdir('controllers'),
          // mkdir('errors'),
          // mkdir('middlewares'),
          mkdir('models'),
          mkdir('public'),
          mkdir('routes'),
          // mkfile('app.ts'),
          // mkfile('config.ts'),
        ]),
        mkfile('package.json'),
        mkfile('.eslintrc'),
        mkfile('.gitignore'),
        mkfile('.env.example'),
        mkfile('.editorconfig'),
        mkfile('tsconfig.json'),
      ]),
    ]);
    const structureErrors = checkStructure(projectPath, tree);

    if (structureErrors.length) {
      return structureErrors;
    }

    const projectBackendPath = path.join(projectPath, 'backend');

    const errors = (await Promise.all([
      checkDependencies(projectBackendPath),
      checkScripts(path.join(projectBackendPath, 'package.json')),
      checkEslintConfig(path.join(projectBackendPath, '.eslintrc'), {
        extends: 'airbnb-base',
        rules: {
          'no-underscore-dangle': ['error', { allow: ['_id'] }]
        }
      }),
      checkTrackingFiles(projectBackendPath, [
        { fileName: 'node_modules/test.js', pattern: 'node_modules' },
        { fileName: '.env', pattern: '.env' },
        { fileName: 'error.log', pattern: '*.log' },
        { fileName: 'request.log', pattern: '*.log' },
      ]),
      checkEditorConfig(path.join(projectBackendPath, '.editorconfig'), [
        'indent_style = space',
        'indent_size = 2',
        'end_of_line = lf',
        'charset = utf-8',
        'trim_trailing_whitespace = true',
        'trim_trailing_whitespace = false',
        'insert_final_newline = true',
      ]),
      checkEslint(projectBackendPath),
    ]))
      .filter(Boolean)
      .flat();

    return errors;
  };

  await runTests(options, check);
};

app(PROJECT_PATH, LANG);
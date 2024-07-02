import fs from 'fs';
import path from 'path';
import dirTree from 'directory-tree';
import simpleGit from 'simple-git';
import shell from 'shelljs';
import depcheck from 'depcheck';
import {
  isDirectory,
} from '@hexlet/immutable-fs-trees';

const checkStructure = (source, expectedTree) => {
  const projectTree = dirTree(source, { attributes: ['type'] });

  const search = (canonicalTree, actualTree) => {
    const errors = canonicalTree.reduce((acc, item) => {
      const found = actualTree.find(({ name, type }) => item.name === name && item.type === type);
      if (!found) {
        return [...acc, {
          id: `structureError.${item.type}`,
          values: {
            name: item.name,
          },
        }];
      }

      if (isDirectory(item) && found) {
        return [...acc, ...search(item.children || [], found.children || [])];
      }

      return acc;
    }, []);

    return errors;
  };

  return search(expectedTree.children || [], projectTree.children || []);
};

const checkEslintConfig = (filePath, config) => {
  const errors = [];
  const has = Object.prototype.hasOwnProperty;
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (Array.isArray(content.extends)) {
    const hasConfig = content.extends.includes(config.extends);

    if (!hasConfig) {
      errors.push({
        id: 'eslintConfigError',
        values: {
          key: 'extends',
          value: config.extends,
        },
      });
    }
  } else if (content.extends !== config.extends) {
    errors.push({
      id: 'eslintConfigError',
      values: {
        key: 'extends',
        value: config.extends,
      },
    });
  }

  Object.entries(config.rules).forEach(([key, value]) => {
    const contentValue = JSON.stringify(content.rules[key]);
    const configValue = JSON.stringify(value);

    if (!has.call(content.rules, key) || contentValue !== configValue) {
      errors.push({
        id: 'eslintConfigError',
        values: {
          key,
          value: configValue,
        },
      });
    }
  });

  return errors;
};

const checkScripts = (filePath) => {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const commands = ['start', 'dev', 'lint'];
  const { scripts } = content;

  if (!scripts) {
    return [{ id: 'scripts.sectionMissing', }];
  }

  return commands.reduce((acc, command) => {
    if (!(command in scripts)) {
      return [
        ...acc,
        {
          id: 'scripts.commandMissing',
          values: { command }
        }
      ]
    }

    return acc;
  }, []);
};

const checkDependencies = async (source) => {
  const result = await depcheck(source, {
    ignoreBinPackage: false,
    skipMissing: true,
  });

  if (result.dependencies.length > 0) {
    return {
      id: 'dependenciesError',
      values: {
        dependencies: result.dependencies.join(', ')
      }
    }
  }

  return [];
};

const checkTrackingFiles = async (source, files) => {
  const git = simpleGit(source);

  return await files.reduce(async (errorsPromise, { fileName, pattern }) => {
    let errors = await errorsPromise;
    const filePath = path.join(source, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'change');

    const status = await git.status();
    const isFoundNotAdded = status.not_added.find((file) =>
      path.basename(file) === path.basename(fileName)
    );
    const isFoundModified = status.modified.find((file) =>
      path.basename(file) === path.basename(fileName)
    );
    fs.unlinkSync(filePath);

    if (isFoundNotAdded || isFoundModified) {
      errors.push({
        id: 'trackingError',
        values: { pattern },
      });
    }

    return errors;
  }, []);
}

const checkEditorConfig = (filePath, configList) => {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/\s/g, '');
  const needToAdd = configList.filter((config) => !content.includes(config.replace(/\s/g, '')));
  return needToAdd.map((config) => ({
    id: 'editorConfigError',
    values: {
      config,
      fileName: path.basename(filePath),
    },
  }));
};

const checkEslint = (source) => {
  const reportFilepath = `${process.cwd()}/eslint-report.txt`;
  const { code } = shell.exec(`npx eslint src/**/*.ts -o ${reportFilepath}`, { cwd: source });
  if (code !== 0) {
    const report = fs.readFileSync(reportFilepath, 'utf-8');
    fs.unlinkSync(reportFilepath);

    return [{
      id: 'eslintErrors',
      values: { report },
    }]
  }

  return [];
}

export {
  checkStructure,
  checkEslintConfig,
  checkScripts,
  checkDependencies,
  checkTrackingFiles,
  checkEditorConfig,
  checkEslint,
};
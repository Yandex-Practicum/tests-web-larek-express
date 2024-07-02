import fs from 'fs';
import path from 'path';
import i18next from 'i18next';

const runTests = async (options, check) => {
  const {
    lang,
    projectPath,
    resources,
  } = options;

  await i18next.init({
    lng: lang,
    resources,
  });

  try {
    const errors = await check(projectPath, lang);

    if (errors.length) {
      const errorsText = errors.map((error, index) => `${index + 1}. ${i18next.t(error.id, error.values || {})}`).join('\r\n');
      fs.writeFileSync('./result.txt', errorsText);
    }
  } catch (error) {
    console.log(error);
  }
};

export {
  runTests,
};
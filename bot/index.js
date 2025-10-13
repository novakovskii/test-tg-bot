import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { saveRegistration, getRegistration } from './db.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Состояния анкеты
const STATES = {
  IDLE: 'idle',
  WAITING_FIRSTNAME: 'waiting_firstname',
  WAITING_LASTNAME: 'waiting_lastname',
  WAITING_PHONE: 'waiting_phone',
  WAITING_COMPANY: 'waiting_company',
  WAITING_ACTIVITY_TYPE: 'waiting_activity_type',
  COMPLETED: 'completed'
};

// Хранилище данных пользователей
const userStates = new Map();
const userData = new Map();

// Функции валидации
const validators = {
  firstname: (text) => {
    if (!text || text.trim().length < 2) {
      return { valid: false, error: '❌ Имя должно содержать минимум 2 символа.\n\n <b>Попробуйте еще раз:</b>' };
    }
    if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(text.trim())) {
      return { valid: false, error: '❌ Имя должно содержать только буквы. Попробуйте еще раз:' };
    }
    return { valid: true };
  },

  lastname: (text) => {
    if (!text || text.trim().length < 2) {
      return { valid: false, error: '❌ Фамилия должна содержать минимум 2 символа.\n\n <b>Попробуйте еще раз:</b>' };
    }
    if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(text.trim())) {
      return { valid: false, error: '❌ Фамилия должна содержать только буквы. Попробуйте еще раз:' };
    }
    return { valid: true };
  },

  phone: (text) => {
    const phoneRegex = /^(?:\+7|7|8)\s*\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}$/;

    const trimmed = text.trim();
    if (!phoneRegex.test(trimmed)) {
      return { valid: false, error: '❌ Пожалуйста, введите корректный номер телефона.\n\n <b>Попробуйте еще раз:</b>' };
    }
    
    return { valid: true };
  },
  
  company: (text) => {
    if (!text || text.trim().length < 2) {
      return { valid: false, error: '❌ Название компании должно содержать минимум 2 символа.\n\n <b>Попробуйте еще раз:</b>' };
    }
    return { valid: true };
  },
  
  activity_type: (text) => {
    if (!text || text.trim().length < 2) {
      return { valid: false, error: '❌ Название сферы деятельности должно содержать минимум 2 символа.\n\n <b>Попробуйте еще раз:</b>' };
    }
    return { valid: true };
  }
};

// Инициализация пользователя
const initUser = (userId) => {
  userStates.set(userId, STATES.IDLE);
  userData.set(userId, {});
};

// Получение данных пользователя
const getUserData = (userId) => {
  if (!userData.has(userId)) {
    initUser(userId);
  }
  return userData.get(userId);
};

// Получение состояния пользователя
const getUserState = (userId) => {
  if (!userStates.has(userId)) {
    initUser(userId);
  }
  return userStates.get(userId);
};

// Установка состояния пользователя
const setUserState = (userId, state) => {
  userStates.set(userId, state);
};

// Команда /start - показывается при первом открытии бота
bot.start((ctx) => {
  const userId = ctx.from.id;
  initUser(userId);

  ctx.reply(
    '<b>Укажите ваше имя:</b>', 
    { parse_mode: 'HTML' }
  );
  
  setUserState(userId, STATES.WAITING_FIRSTNAME);
});

// Обработчик текстовых сообщений
bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  const data = getUserData(userId);
  const text = ctx.message.text;
  
  switch (state) {
    case STATES.WAITING_FIRSTNAME:
      const nameValidation = validators.firstname(text);
      if (!nameValidation.valid) {
        return ctx.reply(nameValidation.error, { parse_mode: 'HTML' });
      }
      
      data.firstname = text.trim();
      setUserState(userId, STATES.WAITING_LASTNAME);
      ctx.reply('<b>Укажите вашу фамилию:</b>', { parse_mode: 'HTML' });
      break;
      
    case STATES.WAITING_LASTNAME:
      const lastnameValidation = validators.lastname(text);
      if (!lastnameValidation.valid) {
        return ctx.reply(lastnameValidation.error, { parse_mode: 'HTML' });
      }
      
      data.lastname = text.trim();
      setUserState(userId, STATES.WAITING_PHONE);
      ctx.reply('<b>Укажите ваш номер телефона:</b>', { parse_mode: 'HTML' });
      break;
      
    case STATES.WAITING_PHONE:
      const phoneValidation = validators.phone(text);
      if (!phoneValidation.valid) {
        return ctx.reply(phoneValidation.error, { parse_mode: 'HTML' });
      }
      
      data.phone = text.trim();
      setUserState(userId, STATES.WAITING_COMPANY);
      ctx.reply('<b>Укажите название вашей компании:</b>', { parse_mode: 'HTML' });
      break;
      
    case STATES.WAITING_COMPANY:
      const companyValidation = validators.company(text);
      if (!companyValidation.valid) {
        return ctx.reply(companyValidation.error, { parse_mode: 'HTML' });
      }
      
      data.company = text.trim();
      setUserState(userId, STATES.WAITING_ACTIVITY_TYPE);
      ctx.reply('<b>Укажите вашу сферу деятельности:</b>', { parse_mode: 'HTML' });
      break;
      
    case STATES.WAITING_ACTIVITY_TYPE:
      const activityTypeValidation = validators.activity_type(text);
      if (!activityTypeValidation.valid) {
        return ctx.reply(activityTypeValidation.error, { parse_mode: 'HTML' });
      }
      
      data.activity_type = text.trim();
      setUserState(userId, STATES.COMPLETED);

      // СОХРАНЯЕМ ДАННЫЕ В БД
      try {
        saveRegistration({
          telegram_id: userId,
          firstname: data.firstname,
          lastname: data.lastname,
          phone: data.phone,
          company: data.company,
          activity_type: data.activity_type,
        });

        // Формируем итоговое сообщение
        const summary = 
          `✅ <b>${data.firstname}, записали вас на вебинар.</b>\n\n` +
          'Он стартует 30 октября в 10:00 по МСК. Мы пришлем сообщение с напоминанием и ссылкой на вебинар заранее, поэтому не отключайте, пожалуйста, уведомления.\n\n' +
          'До встречи!\n\n'
        
        ctx.reply(summary, { parse_mode: 'HTML' });
      } catch (e) {
        console.error('DB error:', e);
        return ctx.reply('Произошла ошибка при сохранении. Попробуйте позже.');
      }
      
      break;
      
    case STATES.IDLE:
      ctx.reply('Для начала регистрации используйте команду /start');
      break;
      
    case STATES.COMPLETED:
      ctx.reply('Вы уже зарегистрированы! Для повторной регистрации используйте команду /start');
      break;
  }
});

// Обработчик команды /help
bot.help((ctx) => {
  ctx.reply(
    '📖 Справка по командам:\n\n' +
    '/start - Начать регистрацию на вебинар\n' +
    '/help - Показать эту справку'
  );
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Ошибка для ${ctx.updateType}:`, err);
  ctx.reply('Произошла ошибка. Попробуйте позже.');
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log('✅ Бот успешно запущен!');
  })
  .catch((err) => {
    console.error('❌ Ошибка запуска бота:', err);
  });

// Корректное завершение при остановке процесса
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


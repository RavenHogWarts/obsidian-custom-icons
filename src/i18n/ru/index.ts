import type { BaseTranslation } from '../i18n-types'

const ru = {
	settings: {
		communityPlugin: {
			name: "Плагины сообщества",
			enable: {
				name: "Включить",
				desc: "Добавьте иконки для плагинов сообщества без иконок",
			},
			searchResults: {
				name: "Показывать иконки в поиске",
				desc: "Показывать иконки плагинов в результатах поиска настроек (работает только в Obsidian 1.13.0+)",
			},
			default: {
				name: "Иконка по умолчанию",
				desc: "Установите иконку по умолчанию для плагинов сообщества без иконок",
				resetTooltip: "Сбросить",
				dicesTooltip: "Случайная",
			},
			search: {
				placeholder: "Введите название плагина или идентификатор...",
				noneFound: "Подходящих плагинов не найдено",
				resetTooltip: "Сбросить все к иконке по умолчанию",
				dicesTooltip: "Выбрать все иконки случайно",
			},
			pluginList: {
				name: "Список плагинов",
				desc: "Добавьте иконки для плагинов сообщества, у которых их нет (Исправление для Obsidian v1.11.0)",
				resetTooltip: "Сброс к иконке по умолчанию",
				dicesTooltip: "Случайная иконка",
			},
		},
		ribbon: {
			name: "Ribbon",
			enable: {
				name: "Включить функцию",
				desc: "Настроить значки для кнопок левой боковой панели (Ribbon)",
			},
			list: {
				name: "Список кнопок",
				desc: "Назначить значки кнопкам Ribbon (распознаются по тексту подсказки)",
				noneFound: "Кнопки Ribbon не найдены",
				resetTooltip: "Сбросить к исходному значку",
				refreshTooltip: "Обновить список",
				hasIcon: "Есть значок",
				noIcon: "Нет значка",
				customized: "Настроено",
			},
		},
		experimental: {
			name: "Экспериментальные",
			keepPluginFirst: {
				name: "Всегда загружать этот плагин первым",
				desc: "Автоматически удерживать этот плагин на первом месте в массиве .obsidian/community-plugins.json (плагины сообщества загружаются в этом порядке), чтобы другим плагинам не грозили пустые значки из-за порядка загрузки. Obsidian перезаписывает массив при каждом включении/отключении плагинов; эта функция исправляет порядок при каждой загрузке плагина. Только меняет порядок, ничего не добавляя и не удаляя. Действует со следующего запуска. Экспериментальная функция — отключите при сбоях.",
			},
		},
	},
	common: {
		save: "Сохранить",
		add: "Добавить",
		edit: "Изменить",
		delete: "Удалить",
		cancel: "Отменить",
	},
	view: {
		CustomIconLib: {
			name: "Пользовательская библиотека иконок",
			command: "Открыть пользовательскую библиотеку иконок",
			reapplyCommand: "Повторно применить все значки",
			reapplyNotice: "Все пользовательские значки применены повторно",
			searchPlaceholder: "Поиск иконки...",
				svg: {
					tabName: "SVG (экспериментально)",
					copyAction: "Копировать SVG код",
					modal: {
						pasteMode: "Вставить код",
						uploadMode: "Загрузить файлы",
						idPlaceholder: "Идентификатор иконки (например: my-icon)",
						contentPlaceholder: "Содержание SVG (<svg>...</svg>)",
						selectFiles: "Выбрать SVG файлы",
						selectFilesDesc: "Вы можете выбрать несколько SVG файлов для пакетного добавления иконок. Имена файлов будут использоваться в качестве идентификаторов иконок.",
						selectedFiles: "Выбрано файлов: {count:number}",
					},
				},
				pack: {
					tabName: "Наборы иконок",
					installing: "Загрузка набора иконок…",
					progress: "Загрузка иконок {done:number}/{total:number}…",
					installed: "Установлено иконок: {count:number}, вступает в силу сразу",
					installFailed: "Не удалось установить набор иконок",
					iconCount: "Иконок",
					licenseLabel: "Лицензия",
					idLabel: "Префикс ID иконок",
					sourcePackage: "Исходный пакет",
					bigPackWarning:
						"Набор содержит {count:number} иконок — установка и синхронизация могут занять время. Продолжить?",
					offlineHint:
						"После установки иконки хранятся локально и работают офлайн.",
					npmModal: {
						title: "Свой набор из npm",
						packIdPlaceholder:
							"ID набора (строчные буквы/цифры/дефисы, напр. my-icons)",
						packagePlaceholder: "npm-пакет (напр. @tabler/icons)",
						globPlaceholder: "glob-путь к SVG (напр. icons/outline/*.svg)",
						versionPlaceholder: "Версия (необязательно, по умолчанию latest)",
						hint: "Загружает отдельные SVG-файлы из npm CDN; поддерживаются *, ** и перечисление вариантов через запятую.",
					},
					uninstallHint:
						"Будет удалено {count:number} иконок (локальный файл и манифест). Места их использования станут пустыми.",
					uninstallFailed: "Не удалось удалить набор иконок",
					refreshTooltip: "Обновить каталог",
					installedSection: "Установленные",
					noPacksInstalled:
						"Наборы ещё не установлены — выберите из каталога ниже.",
					iconCountLabel: "Иконок: {count:number}",
					browseTooltip: "Просмотр иконок",
					enabledTooltip: "Включить/отключить этот набор иконок",
					catalogSection: "Каталог наборов (Iconify, 220+)",
					cachedAt: "Каталог закэширован: {time}",
					catalogCached: "офлайн-кэш",
					catalogOnline: "онлайн",
					catalogLoadFailed:
						"Не удалось загрузить каталог (нет сети и кэша)",
					catalogLoading: "Загрузка каталога наборов…",
					presetsSection: "Популярные npm-наборы (в один клик)",
					alreadyInstalled: "Установлен",
					backTooltip: "Назад",
					detailHint:
						"Только просмотр. Нажмите на иконку, чтобы скопировать полный ID (префикс CI-).",
					previewTitle: "Предпросмотр",
					previewLoading: "Загрузка предпросмотра…",
					previewEmpty: "Нет образцов для предпросмотра",
					previewFailed: "Не удалось загрузить предпросмотр",
					showMore: "Показать ещё ({shown:number}/{total:number})",
				},
			lucide: {
				tabName: "Lucide",
				count: "Значков: {count:number}",
				descHints: {
					all: "Все значки Lucide, встроенные в плагин (без дубликатов). Нажмите на значок, чтобы скопировать его название.",
					builtin:
						"Значки, уже встроенные в Obsidian. Приведены для справки. Нажмите на значок, чтобы скопировать его название.",
					extra:
						"Значки Lucide, встроенные в плагин, но отсутствующие в Obsidian. Нажмите на значок, чтобы скопировать его название.",
				},
				filter: {
					group: "Фильтр значков",
					all: "Все",
					builtin: "Встроенные",
					extra: "Дополнительные",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default ru;

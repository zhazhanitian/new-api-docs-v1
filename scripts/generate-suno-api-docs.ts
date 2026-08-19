import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type FieldName =
  | 'version'
  | 'custom'
  | 'instrumental'
  | 'prompt'
  | 'title'
  | 'tags'
  | 'style'
  | 'negative_tags'
  | 'gpt_description'
  | 'auto_lyrics'
  | 'persona_id'
  | 'vocal_gender'
  | 'style_weight'
  | 'weirdness_constraint'
  | 'audio_weight'
  | 'task_id'
  | 'audio_index'
  | 'task_ids'
  | 'audio_indexes'
  | 'audio_urls'
  | 'audio_url'
  | 'start_s'
  | 'end_s'
  | 'continue_at'
  | 'audio_file_path'
  | 'type'
  | 'bpm'
  | 'key'
  | 'speed'
  | 'keep_pitch'
  | 'variation_category'
  | 'stem_type'
  | 'name'
  | 'description'
  | 'styles'
  | 'vox_audio_id'
  | 'vocal_start_s'
  | 'vocal_end_s'
  | 'lyrics_model'
  | 'duration_s'
  | 'infill_lyrics';

type ModelDoc = {
  id: string;
  title: string;
  enTitle: string;
  jaTitle: string;
  description: string;
  fields: FieldName[];
  required?: FieldName[];
  versions?: string[];
  example: Record<string, unknown>;
  notes?: string[];
  fieldOverrides?: Partial<Record<FieldName, Record<string, unknown>>>;
};

const allVersions = ['v3.5', 'v4', 'v4.5', 'v4.5+', 'v4.5-all', 'v5', 'v5.5'];
const generationFields: FieldName[] = [
  'custom',
  'instrumental',
  'prompt',
  'gpt_description',
  'title',
  'tags',
  'negative_tags',
  'auto_lyrics',
  'persona_id',
  'vocal_gender',
  'style_weight',
  'weirdness_constraint',
  'audio_weight',
];
const sourceFields: FieldName[] = ['task_id', 'audio_index'];

const models: ModelDoc[] = [
  {
    id: 'suno-music',
    title: '生成音乐',
    enTitle: 'Generate Music',
    jaTitle: '音楽生成',
    description:
      '根据灵感描述或自定义歌词生成完整歌曲，适用于歌曲创作、纯音乐和指定风格音乐生成。',
    fields: [
      'version',
      'custom',
      'instrumental',
      'prompt',
      'title',
      'style',
      'negative_tags',
      'auto_lyrics',
      'persona_id',
      'vocal_gender',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
    ],
    required: ['version'],
    versions: allVersions,
    example: {
      model: 'suno-music',
      version: 'v5',
      custom: false,
      instrumental: false,
      prompt: '深夜城市中的 lo-fi 钢琴，伴随轻柔雨声',
    },
    notes: [
      '`version` 是平台在提交阶段强制校验的必填字段。',
      '`suno-music` 使用 `style` 表示风格，不使用 `tags`。',
      '`custom=false` 或省略时为灵感模式，`prompt` 必填并作为灵感描述；`title`、`style` 及仅自定义模式字段会被忽略。',
      '`custom=true` 时为自定义模式；`instrumental=false` 或省略时 `prompt` 必填并作为歌词，`instrumental=true` 时可省略歌词。',
      '模式不匹配的字段会被上游静默忽略，不会报错。',
      '音乐生成通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      custom: {
        default: false,
        description:
          '`false` 为灵感模式，`prompt` 作为灵感描述；`true` 为自定义模式，`prompt` 作为歌词。默认 `false`。',
      },
      instrumental: {
        default: false,
        description: '`true` 表示生成纯音乐、无人声；默认 `false`。',
      },
      prompt: {
        description:
          '灵感提示词或歌词。灵感模式下必填；自定义模式下，非纯音乐时必填，纯音乐时可省略。',
      },
      title: {
        description: '歌曲标题。仅 `custom=true` 时生效，灵感模式下静默忽略。',
      },
      style: {
        description:
          '歌曲风格标签。仅 `custom=true` 时生效；本模型使用 `style`，不是 `tags`。',
      },
      negative_tags: {
        description: '不希望出现的风格标签。仅 `custom=true` 时生效。',
      },
      auto_lyrics: {
        description: '是否对输入歌词进行二次创作。仅 `custom=true` 时生效。',
      },
      persona_id: {
        description: 'Persona 风格 ID。仅 `custom=true` 时生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female', 'm', 'f', 'male', 'female'],
        description:
          '人声性别。支持 `Male`、`Female` 以及 `m`、`f`、`male`、`female`，两种生成模式均生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重，范围 0.00–1.00。仅 `custom=true` 时生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意度，范围 0.00–1.00。仅 `custom=true` 时生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重，范围 0.00–1.00。仅 `custom=true` 时生效。',
      },
    },
  },
  {
    id: 'suno-lyrics',
    title: '生成歌词',
    enTitle: 'Generate Lyrics',
    jaTitle: '歌詞生成',
    description: '根据主题或创作要求生成歌词，适用于歌曲创作前的歌词草拟。',
    fields: ['prompt', 'lyrics_model'],
    example: {
      model: 'suno-lyrics',
      prompt: '写一首关于夏夜海边重逢的中文流行歌词',
      lyrics_model: 'classic',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '任务完成后，结果数据中包含生成的歌词文本。',
      '建议每 3–5 秒查询一次公共任务接口，直到任务成功或失败。',
    ],
    fieldOverrides: {
      prompt: {
        description: '歌词主题、内容或创作要求。',
      },
      lyrics_model: {
        enum: ['classic', 'remi'],
        description:
          '歌词模型，可选 `classic` 或 `remi`。该字段会被透传；省略时使用上游默认模型。',
      },
    },
  },
  {
    id: 'suno-aligned-lyrics',
    title: '歌词时间轴',
    enTitle: 'Aligned Lyrics',
    jaTitle: '歌詞タイムライン',
    description:
      '为已有 Suno 音轨生成带时间对齐信息的歌词，适用于字幕和逐字歌词展示。',
    fields: sourceFields,
    required: ['task_id'],
    example: {
      model: 'suno-aligned-lyrics',
      task_id: 'task_source123',
      audio_index: 1,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用音轨，无需记录额外音频 ID。',
      '任务完成后，结果中包含带时间戳的逐句对齐歌词。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`；一次生成通常包含第 1、2 首。',
      },
    },
  },
  {
    id: 'suno-bpm',
    title: 'BPM 分析',
    enTitle: 'BPM Analysis',
    jaTitle: 'BPM分析',
    description: '分析已有音轨的速度信息，适用于节拍检测和后续编曲处理。',
    fields: sourceFields,
    required: ['task_id'],
    example: { model: 'suno-bpm', task_id: 'task_source123', audio_index: 1 },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用音轨，无需记录额外音频 ID。',
      '任务完成后，结果中包含分析得到的 BPM 数值。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`；一次生成通常包含第 1、2 首。',
      },
    },
  },
  {
    id: 'suno-concat',
    title: '完整歌曲合成、拼接',
    enTitle: 'Concatenate Song',
    jaTitle: '楽曲連結',
    description: '将已有歌曲任务中的片段合成为完整歌曲，适用于续写结果的拼接。',
    fields: sourceFields,
    required: ['task_id'],
    example: {
      model: 'suno-concat',
      task_id: 'task_extend123',
      audio_index: 1,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '**源任务必须是 `suno-extend` 续写产生的分段结果**；普通一次性生成的完整歌曲不能用于拼接，上游会返回参数错误。',
      '使用续写任务的 `task_id` 和 `audio_index` 引用待拼接分段，无需记录额外音频 ID。',
      '完成后从任务结果 `music[]` 中读取完整歌曲的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '源任务 ID，必须指向 `suno-extend` 续写产生的分段。缺失、来源类型不正确或上游无法解析时会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源续写任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`；一次生成通常包含第 1、2 首。',
      },
    },
  },
  {
    id: 'suno-generate-video',
    title: '生成音乐视频',
    enTitle: 'Generate Music Video',
    jaTitle: 'ミュージックビデオ生成',
    description: '为已有音轨生成音乐视频，适用于歌曲分享和视频化展示。',
    fields: sourceFields,
    required: ['task_id'],
    example: {
      model: 'suno-generate-video',
      task_id: 'task_source123',
      audio_index: 1,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲，无需记录额外音频 ID。',
      '任务完成后，从任务结果 `music[]` 中读取生成的 `video_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`；一次生成通常包含第 1、2 首。',
      },
    },
  },
  {
    id: 'suno-persona',
    title: 'Persona',
    enTitle: 'Create Persona',
    jaTitle: 'Persona作成',
    description:
      '从已有音轨创建可复用的 Persona 风格，适用于保持后续歌曲的声音或风格一致性。',
    fields: [
      ...sourceFields,
      'name',
      'description',
      'styles',
      'vox_audio_id',
      'vocal_start_s',
      'vocal_end_s',
    ],
    required: ['task_id', 'name'],
    example: {
      model: 'suno-persona',
      task_id: 'task_source123',
      audio_index: 1,
      name: 'Warm Indie Vocal',
      description: '温暖、自然的独立流行人声',
      styles: 'indie pop, warm vocal',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲；`name` 为必填字段。',
      '可以绑定 `suno-vox` 提取结果；绑定时，人声开始和结束时间必须与提取 Vox 时的区间一致。',
      '任务完成后，结果中包含创建的 Persona 信息。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`。',
      },
      name: { description: 'Persona 名称，必填。' },
      description: { description: 'Persona 描述。' },
      styles: { description: 'Persona 风格。' },
      vox_audio_id: {
        description: '通过 `suno-vox` 提取到的 Vox 音频 ID。',
      },
      vocal_start_s: {
        description:
          '人声截取起点（秒）。引用 `vox_audio_id` 时，必须与提取该 Vox 时的起点一致。',
      },
      vocal_end_s: {
        description:
          '人声截取终点（秒）。引用 `vox_audio_id` 时，必须与提取该 Vox 时的终点一致。',
      },
    },
  },
  {
    id: 'suno-upload',
    title: '上传音频',
    enTitle: 'Upload Audio',
    jaTitle: '音声アップロード',
    description:
      '把一段公网音频导入，得到可供后续翻唱、续写等操作引用的音轨；任务完成后，本任务 `task_id` 即可作为源任务，并使用 `audio_index=1` 引用音轨。',
    fields: ['audio_file_path'],
    required: ['audio_file_path'],
    example: {
      model: 'suno-upload',
      audio_file_path: 'https://example.com/source.mp3',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '请提供公网可直接访问的音频链接；MAPI 对外字段名为 `audio_file_path`。',
      '**不要上传纯器乐（无人声）音频**，官方说明此类音频可能解析失败。',
      '任务完成后，可使用本任务 `task_id` 和 `audio_index=1` 作为翻唱、续写等后续操作的源音轨。',
      '建议每 3–5 秒查询一次公共任务接口，直到任务成功或失败。',
    ],
    fieldOverrides: {
      audio_file_path: {
        format: 'uri',
        description:
          '公网可直接访问的音频直链，必填。MAPI 会将该字段转换为上游需要的音频文件路径字段。',
      },
    },
  },
  {
    id: 'suno-upsample-tags',
    title: '标签增强',
    enTitle: 'Upsample Tags',
    jaTitle: 'タグ強化',
    description: '扩展和优化音乐风格标签，适用于生成前完善风格描述。',
    fields: ['tags'],
    required: ['tags'],
    example: { model: 'suno-upsample-tags', tags: 'lo-fi, piano, rainy night' },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '这是上游同步能力，通常在提交后即可完成；MAPI 仍统一返回任务 ID，并允许通过公共任务接口查询完成结果。',
      '增强后的标签由任务结果中的 `upsampled_tags` 数据提供。',
    ],
    fieldOverrides: {
      tags: {
        description: '需要优化或扩写的风格标签，必填。',
      },
    },
  },
  {
    id: 'suno-vox',
    title: '提取 Vox',
    enTitle: 'Extract Vox',
    jaTitle: 'Vox抽出',
    description: '从已有音轨中提取人声片段，适用于人声复用和 Persona 创建。',
    fields: [...sourceFields, 'vocal_start_s', 'vocal_end_s'],
    required: ['task_id'],
    example: {
      model: 'suno-vox',
      task_id: 'task_source123',
      audio_index: 1,
      vocal_start_s: 12,
      vocal_end_s: 42,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲。',
      '任务结果中的 Vox ID 可作为 `suno-persona` 的 `vox_audio_id` 使用；创建 Persona 时应沿用相同截取区间。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      vocal_start_s: { minimum: 0, description: '人声截取起点，单位为秒。' },
      vocal_end_s: { minimum: 0, description: '人声截取终点，单位为秒。' },
    },
  },
  {
    id: 'suno-wav',
    title: '导出 WAV',
    enTitle: 'Export WAV',
    jaTitle: 'WAV出力',
    description: '将已有音轨导出为 WAV 格式，适用于后期制作和无损音频处理。',
    fields: sourceFields,
    required: ['task_id'],
    example: { model: 'suno-wav', task_id: 'task_source123', audio_index: 1 },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲。',
      '任务完成后，结果中包含导出的 WAV 文件 URL。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description:
          '源任务结果 `music[]` 中的音轨序号，使用 1-based 编号，默认 `1`；一次生成通常包含第 1、2 首。',
      },
    },
  },
  {
    id: 'suno-crop',
    title: '裁剪音频',
    enTitle: 'Crop Audio',
    jaTitle: '音声トリミング',
    description: '按时间范围裁剪已有音轨，适用于截取片段和素材整理。',
    fields: [...sourceFields, 'start_s', 'end_s'],
    required: ['task_id', 'start_s', 'end_s'],
    example: {
      model: 'suno-crop',
      task_id: 'task_source123',
      audio_index: 1,
      start_s: 10,
      end_s: 45,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`start_s` 和 `end_s` 均为必填，表示需要保留的时间区间。',
      '任务完成后，从结果 `music[]` 中读取裁剪后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      start_s: { minimum: 0, description: '裁剪保留区间的起点（秒），必填。' },
      end_s: { minimum: 0, description: '裁剪保留区间的终点（秒），必填。' },
    },
  },
  {
    id: 'suno-fade-in',
    title: '淡入',
    enTitle: 'Fade In',
    jaTitle: 'フェードイン',
    description: '为已有音轨添加淡入效果。',
    fields: [...sourceFields, 'duration_s', 'title'],
    required: ['task_id', 'duration_s'],
    example: {
      model: 'suno-fade-in',
      task_id: 'task_source123',
      audio_index: 1,
      duration_s: 4,
      title: 'Fade In Version',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`duration_s` 为必填，表示音频开头的淡入时长。',
      '`title` 省略时，上游默认使用 `Untitled`。',
      '任务完成后，从结果 `music[]` 中读取处理后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      duration_s: { minimum: 0, description: '淡入时长，单位为秒，必填。' },
      title: {
        default: 'Untitled',
        description: '结果标题，默认 `Untitled`。',
      },
    },
  },
  {
    id: 'suno-fade-out',
    title: '淡出',
    enTitle: 'Fade Out',
    jaTitle: 'フェードアウト',
    description: '为已有音轨添加淡出效果。',
    fields: [...sourceFields, 'duration_s', 'title'],
    required: ['task_id', 'duration_s'],
    example: {
      model: 'suno-fade-out',
      task_id: 'task_source123',
      audio_index: 1,
      duration_s: 6,
      title: 'Fade Out Version',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`duration_s` 为必填，表示音频结尾的淡出时长。',
      '`title` 省略时，上游默认使用 `Untitled`。',
      '任务完成后，从结果 `music[]` 中读取处理后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      duration_s: { minimum: 0, description: '淡出时长，单位为秒，必填。' },
      title: {
        default: 'Untitled',
        description: '结果标题，默认 `Untitled`。',
      },
    },
  },
  {
    id: 'suno-remove-section',
    title: '删除片段',
    enTitle: 'Remove Section',
    jaTitle: 'セクション削除',
    description: '删除已有音轨中指定时间范围的片段。',
    fields: [...sourceFields, 'start_s', 'end_s'],
    required: ['task_id', 'start_s', 'end_s'],
    example: {
      model: 'suno-remove-section',
      task_id: 'task_source123',
      audio_index: 1,
      start_s: 30,
      end_s: 42,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`start_s` 和 `end_s` 均为必填，表示需要从歌曲中删除的时间区间。',
      '任务完成后，从结果 `music[]` 中读取处理后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      start_s: { minimum: 0, description: '删除区间的起点（秒），必填。' },
      end_s: { minimum: 0, description: '删除区间的终点（秒），必填。' },
    },
  },
  {
    id: 'suno-sounds',
    title: '音效生成',
    enTitle: 'Generate Sound',
    jaTitle: '効果音生成',
    description:
      '根据文本描述生成短音效或循环音效，适用于视频、游戏和音乐制作。',
    fields: ['version', 'prompt', 'type', 'bpm', 'key'],
    required: ['prompt'],
    versions: ['v5', 'v5.5'],
    example: {
      model: 'suno-sounds',
      version: 'v5.5',
      prompt: '森林中由远及近的雷声和雨声',
      type: 'one-shot',
      bpm: 90,
      key: 'Cm',
    },
    notes: [
      '`version` 仅支持 `v5` 和 `v5.5`，省略时上游默认使用 `v5.5`。',
      '官方建议尽量使用英文音效描述，以获得更好的生成效果。',
      '任务完成后，从结果 `music[]` 中读取生成音效的 `audio_url`。',
      '建议每 3–5 秒查询一次公共任务接口，直到任务成功或失败。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '生成版本，仅支持 `v5`、`v5.5`，默认 `v5.5`。',
      },
      prompt: { description: '音效文本描述，必填；官方建议优先使用英文。' },
      type: {
        enum: ['one-shot', 'loop'],
        default: 'one-shot',
        description: '音效类型：`one-shot` 为单次音效，`loop` 为可循环音效。',
      },
      bpm: {
        minimum: 1,
        maximum: 300,
        description: '音效速度，范围 1–300；超出范围会被拒绝。',
      },
      key: {
        examples: ['Cm'],
        enum: [
          'C',
          'C#',
          'D',
          'D#',
          'E',
          'F',
          'F#',
          'G',
          'G#',
          'A',
          'A#',
          'B',
          'Cm',
          'C#m',
          'Dm',
          'D#m',
          'Em',
          'Fm',
          'F#m',
          'Gm',
          'G#m',
          'Am',
          'A#m',
          'Bm',
        ],
        description:
          '调性。支持 12 个大调及对应的小调（后缀 `m`）；只支持升号 `#`，不支持降号写法或 `B#`。',
      },
    },
  },
  {
    id: 'suno-create-voice',
    title: '创建语音',
    enTitle: 'Create Voice',
    jaTitle: '音声作成',
    description: '根据公开可访问的 MP3 或 WAV 音频创建语音资产。',
    fields: ['audio_url'],
    required: ['audio_url'],
    example: {
      model: 'suno-create-voice',
      audio_url: 'https://example.com/voice.wav',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '本模型不使用 `task_id` 和 `audio_index`，必须直接提供公网可访问的 `audio_url`。',
      '**源音频仅支持 MP3 或 WAV 格式。**',
      '任务完成后，结果中包含创建的可复用音色信息。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      audio_url: {
        format: 'uri',
        description:
          '源音轨的公网可访问 URL，必填，仅支持 MP3 或 WAV；省略时会返回 `audio_url cannot be empty`。',
      },
    },
  },
  {
    id: 'suno-adjust-speed',
    title: '调整速度',
    enTitle: 'Adjust Speed',
    jaTitle: '速度調整',
    description: '调整已有音轨的播放速度，并可选择是否保持原音高。',
    fields: [...sourceFields, 'speed', 'keep_pitch', 'title'],
    required: ['task_id', 'speed'],
    example: {
      model: 'suno-adjust-speed',
      task_id: 'task_source123',
      audio_index: 1,
      speed: 1.25,
      keep_pitch: true,
      title: 'Faster Version',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`speed` 必填，允许范围为 0.25–4；缺失或越界会被拒绝。',
      '`keep_pitch` 默认 `true`，用于在变速时保持原音高；`title` 默认 `Untitled`。',
      '任务完成后，从结果 `music[]` 中读取处理后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: {
        description:
          '产出源音轨的任务 ID。缺失或上游无法解析源音轨时，提交会失败。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      speed: {
        minimum: 0.25,
        maximum: 4,
        description: '倍速，范围 0.25–4，必填。',
      },
      keep_pitch: {
        default: true,
        description: '变速时是否保持原音高，默认 `true`。',
      },
      title: {
        default: 'Untitled',
        description: '结果标题，默认 `Untitled`。',
      },
    },
  },
  {
    id: 'suno-add-instrumental',
    title: '添加伴奏',
    enTitle: 'Add Instrumental',
    jaTitle: '伴奏追加',
    description: '为已有音轨添加伴奏，适用于基于人声素材生成完整编曲。',
    fields: [
      'version',
      ...sourceFields,
      'custom',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'vocal_gender',
    ],
    required: ['task_id'],
    versions: ['v5', 'v5.5'],
    example: {
      model: 'suno-add-instrumental',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      custom: true,
      tags: 'acoustic pop, warm guitar',
      title: 'Acoustic Arrangement',
    },
    notes: [
      '**源任务必须是通过 `suno-upload` 上传的自有音频**；使用生成任务的音轨作为源会失败。',
      '`version` 仅支持 `v5`、`v5.5`，省略时上游默认使用 `v5.5`。',
      '`custom=true` 时使用 `prompt` 作为歌词；`custom=false` 时 `gpt_description` 必填。模式不匹配的字段会被静默忽略。',
      '省略 `custom` 时依次推断：有 `prompt` 为自定义模式；否则有 `gpt_description` 为灵感模式；否则有 `tags` 或 `title` 为自定义模式。',
      '任务完成后，从结果 `music[]` 中读取 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '生成版本，仅支持 `v5`、`v5.5`，默认 `v5.5`。',
      },
      task_id: {
        description:
          '源音轨所在 `suno-upload` 上传任务的 ID。源必须是用户自行上传的音频。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '上传任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      custom: {
        description:
          '`true` 为自定义歌词模式，`false` 为灵感模式；省略时根据请求内容推断。',
      },
      prompt: {
        description: '歌词，仅 `custom=true` 时生效；灵感模式下静默忽略。',
      },
      gpt_description: {
        description: '灵感提示词，`custom=false` 时必填。',
      },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '需要排除的风格标签，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重，范围 0–1，仅 `custom=true` 时生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意权重，范围 0–1，仅 `custom=true` 时生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重，范围 0–1，仅 `custom=true` 时生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，可选 `Male` 或 `Female`，两种模式均生效。',
      },
    },
  },
  {
    id: 'suno-add-stem',
    title: '添加音轨',
    enTitle: 'Add Stem',
    jaTitle: 'ステム追加',
    description: '向已有歌曲添加新的音轨或乐器层，适用于丰富现有编曲。',
    fields: [
      'version',
      ...sourceFields,
      'custom',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
    ],
    required: ['task_id'],
    versions: ['v5.5'],
    example: {
      model: 'suno-add-stem',
      version: 'v5.5',
      task_id: 'task_source123',
      audio_index: 1,
      custom: true,
      prompt: '加入一条旋律性电吉他音轨',
      tags: 'melodic electric guitar',
    },
    notes: [
      '`version` 仅支持 `v5.5`，省略时也使用 `v5.5`；不要传其他版本，否则会报错或导致任务超时。',
      '`custom=true` 时使用 `prompt`；`custom=false` 时 `gpt_description` 必填。模式不匹配的字段会被静默忽略。',
      '省略 `custom` 时依次根据 `prompt`、`gpt_description`、`tags`/`title` 推断模式。',
      '任务完成后，从结果 `music[]` 中读取 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '生成版本，仅支持 `v5.5`，默认 `v5.5`。',
      },
      task_id: {
        description: '产出源音轨的任务 ID，必填。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
      custom: {
        description:
          '`true` 为自定义模式，`false` 为灵感模式；省略时根据请求内容推断。',
      },
      prompt: { description: '歌词，仅 `custom=true` 时生效。' },
      gpt_description: {
        description: '灵感提示词，`custom=false` 时必填。',
      },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '需要排除的风格标签，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重，范围 0–1，仅 `custom=true` 时生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意权重，范围 0–1，仅 `custom=true` 时生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重，范围 0–1，仅 `custom=true` 时生效。',
      },
    },
  },
  {
    id: 'suno-add-vocals',
    title: '添加人声',
    enTitle: 'Add Vocals',
    jaTitle: 'ボーカル追加',
    description: '为已有伴奏音轨添加人声，适用于从纯音乐制作完整歌曲。',
    fields: [
      'version',
      ...sourceFields,
      'custom',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'vocal_gender',
    ],
    required: ['task_id'],
    versions: ['v5', 'v5.5'],
    example: {
      model: 'suno-add-vocals',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      custom: true,
      prompt: '[Verse]\nWalking through the city lights',
      tags: 'female vocal, synth pop',
      vocal_gender: 'Female',
    },
    notes: [
      '**源任务必须是通过 `suno-upload` 上传的自有音频**；使用生成任务的音轨作为源会失败。',
      '`version` 仅支持 `v5`、`v5.5`，省略时上游默认使用 `v5.5`。',
      '`custom=true` 时使用 `prompt` 作为歌词；`custom=false` 时 `gpt_description` 必填。模式不匹配的字段会被静默忽略。',
      '省略 `custom` 时依次根据 `prompt`、`gpt_description`、`tags`/`title` 推断模式。',
      '任务完成后，从结果 `music[]` 中读取 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '仅支持 `v5`、`v5.5`，默认 `v5.5`。',
      },
      task_id: {
        description: '源音轨所在 `suno-upload` 上传任务的 ID，必填。',
      },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '上传任务音轨序号，1-based，默认 `1`。',
      },
      custom: {
        description:
          '`true` 为自定义模式，`false` 为灵感模式；省略时自动推断。',
      },
      prompt: { description: '歌词，仅 `custom=true` 时生效。' },
      gpt_description: { description: '灵感提示词，`custom=false` 时必填。' },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '排除的风格标签，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重 0–1，仅自定义模式生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意度权重 0–1，仅自定义模式生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重 0–1，仅自定义模式生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，两种模式均生效。',
      },
    },
  },
  {
    id: 'suno-cover',
    title: '风格翻唱',
    enTitle: 'Cover Song',
    jaTitle: 'カバー生成',
    description: '以新的风格重新演绎已有歌曲，适用于曲风转换和翻唱创作。',
    fields: [
      'version',
      ...sourceFields,
      'custom',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'vocal_gender',
      'persona_id',
    ],
    required: ['task_id'],
    versions: allVersions,
    example: {
      model: 'suno-cover',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      custom: false,
      gpt_description: '改编为温暖的原声民谣版本',
    },
    notes: [
      '`version` 支持 `v3.5`、`v4`、`v4.5`、`v4.5+`、`v4.5-all`、`v5`、`v5.5`，默认 `v5.5`。',
      '`custom=true` 时使用 `prompt`、`tags` 等自定义字段；`custom=false` 时只使用 `gpt_description`，且该字段必填。',
      '省略 `custom` 时依次根据 `prompt`、`gpt_description`、`tags`/`title` 推断模式；模式不匹配字段会被静默忽略。',
      '推荐直接提供目标风格 `tags`，系统会推断为自定义模式。',
      '任务完成后，从结果 `music[]` 中读取 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: { default: 'v5.5', description: '生成版本，默认 `v5.5`。' },
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      custom: {
        description:
          '`true` 为自定义模式，`false` 为灵感模式；省略时自动推断。',
      },
      prompt: { description: '歌词，仅 `custom=true` 时生效。' },
      gpt_description: { description: '灵感提示词，`custom=false` 时必填。' },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '目标风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '排除的风格标签，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重 0–1，仅自定义模式生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意度权重 0–1，仅自定义模式生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重 0–1，仅自定义模式生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，两种模式均生效。',
      },
      persona_id: { description: 'Persona 风格 ID，仅 `custom=true` 时生效。' },
    },
  },
  {
    id: 'suno-extend',
    title: '续写延长',
    enTitle: 'Extend Song',
    jaTitle: '楽曲延長',
    description:
      '从指定时间点继续生成已有歌曲，适用于续写、扩展段落和补全结尾。',
    fields: [
      'version',
      ...sourceFields,
      'continue_at',
      'custom',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'vocal_gender',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'auto_lyrics',
      'persona_id',
    ],
    required: ['task_id', 'continue_at'],
    versions: allVersions,
    example: {
      model: 'suno-extend',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      continue_at: 90,
      custom: true,
      prompt: '[Chorus]\nWe will find our way home',
      tags: 'uplifting pop rock',
    },
    notes: [
      '`continue_at` 必填，表示从源音轨的第几秒开始续写。',
      '`version` 支持全部七个 Suno 版本，省略时上游默认使用 `v5.5`。',
      '`custom` 不强制且不会自动推断：`true` 时按 `prompt` 歌词续写；`false` 或省略时可用 `gpt_description` 引导方向。',
      '任务完成后，从结果 `music[]` 中读取延长后的 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: { default: 'v5.5', description: '生成版本，默认 `v5.5`。' },
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      continue_at: {
        minimum: 0,
        description: '从源音轨的第几秒开始续写，必填。',
      },
      custom: {
        description:
          '`true` 按歌词续写；`false` 为灵感续写；省略时不做模式推断。',
      },
      prompt: { description: '续写歌词，仅 `custom=true` 时生效。' },
      gpt_description: {
        description: '灵感提示词，在 `custom=false` 或省略时生效。',
      },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '排除的风格标签，仅 `custom=true` 时生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，两种模式均生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重 0–1，仅自定义模式生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意度权重 0–1，仅自定义模式生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重 0–1，仅自定义模式生效。',
      },
      auto_lyrics: {
        description: '是否对输入歌词二次创作，仅 `custom=true` 时生效。',
      },
      persona_id: { description: 'Persona 风格 ID，仅 `custom=true` 时生效。' },
    },
  },
  {
    id: 'suno-mashup',
    title: '生成混搭',
    enTitle: 'Create Mashup',
    jaTitle: 'マッシュアップ生成',
    description: '将两个已有任务中的音轨混合为新的歌曲。',
    fields: ['version', 'task_ids', 'audio_indexes', ...generationFields],
    required: ['task_ids'],
    versions: allVersions,
    example: {
      model: 'suno-mashup',
      version: 'v5',
      task_ids: ['task_source123', 'task_source456'],
      audio_indexes: [1, 2],
      custom: false,
      gpt_description: '融合电子舞曲节奏和爵士钢琴',
    },
    notes: [
      '`task_ids` 必须且只能包含 2 个源任务 ID；数量不正确会被拒绝。',
      '`audio_indexes` 与 `task_ids` 一一对应，使用 1-based 序号；省略时两个源任务都取第 1 首。',
      '`instrumental` 默认 `false`；`version` 支持全部七个版本，默认 `v5.5`。',
      '`custom=true` 时使用歌词和自定义字段；`custom=false` 时只使用 `gpt_description`，且该字段必填。省略时根据请求内容推断。',
      '任务完成后，从结果 `music[]` 中读取混搭歌曲的 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      task_ids: {
        minItems: 2,
        maxItems: 2,
        description: '两个源音轨所属任务的 ID 数组，必须恰好包含 2 项。',
      },
      audio_indexes: {
        minItems: 2,
        maxItems: 2,
        description:
          '与 `task_ids` 平行的 1-based 音轨序号数组；省略时均使用 `1`。',
      },
      instrumental: {
        default: false,
        description: '是否生成纯器乐，默认 `false`。',
      },
      version: { default: 'v5.5', description: '生成版本，默认 `v5.5`。' },
      custom: {
        description:
          '`true` 为自定义模式，`false` 为灵感模式；省略时自动推断。',
      },
      prompt: { description: '歌词，仅 `custom=true` 时生效。' },
      gpt_description: { description: '灵感提示词，`custom=false` 时必填。' },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '排除的风格标签，仅 `custom=true` 时生效。',
      },
      auto_lyrics: {
        description: '是否对歌词二次创作，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重 0–1，仅自定义模式生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意权重 0–1，仅自定义模式生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重 0–1，仅自定义模式生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，两种模式均生效。',
      },
      persona_id: { description: 'Persona 风格 ID，仅 `custom=true` 时生效。' },
    },
  },
  {
    id: 'suno-midi',
    title: '生成 MIDI',
    enTitle: 'Generate MIDI',
    jaTitle: 'MIDI生成',
    description: '从已有音轨生成 MIDI 数据，适用于编曲分析和 DAW 二次制作。',
    fields: sourceFields,
    required: ['task_id'],
    example: { model: 'suno-midi', task_id: 'task_source123', audio_index: 1 },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲。',
      '任务完成后，结果中包含生成的 MIDI 产物 URL。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
    },
  },
  {
    id: 'suno-remaster',
    title: '母带优化',
    enTitle: 'Remaster',
    jaTitle: 'リマスター',
    description: '对已有音轨进行母带优化，适用于改善整体听感和输出质量。',
    fields: ['version', ...sourceFields, 'variation_category'],
    required: ['task_id'],
    versions: ['v4.5+', 'v5', 'v5.5'],
    example: {
      model: 'suno-remaster',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      variation_category: 'normal',
    },
    notes: [
      '`version` 仅支持 `v4.5+`、`v5`、`v5.5`，省略时上游默认使用 `v5.5`。',
      '`variation_category` 可控制改编强度：`subtle`、`normal` 或 `high`。',
      '任务完成后，从结果 `music[]` 中读取优化后音频的 `audio_url`。',
      '通常需要 30–120 秒，建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '仅支持 `v4.5+`、`v5`、`v5.5`，默认 `v5.5`。',
      },
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      variation_category: {
        enum: ['subtle', 'normal', 'high'],
        description: '改编强度，可选 `subtle`、`normal`、`high`。',
      },
    },
  },
  {
    id: 'suno-replace-section',
    title: '段落替换',
    enTitle: 'Replace Section',
    jaTitle: 'セクション置換',
    description: '重新生成并替换已有音轨的指定时间段。',
    fields: [
      'version',
      ...sourceFields,
      'start_s',
      'end_s',
      'infill_lyrics',
      'prompt',
      'title',
      'tags',
      'negative_tags',
    ],
    required: ['task_id', 'start_s', 'end_s'],
    versions: ['v4', 'v4.5+', 'v5', 'v5.5'],
    example: {
      model: 'suno-replace-section',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      start_s: 45,
      end_s: 68,
      infill_lyrics: '[Chorus]\nSing into the morning light',
      tags: 'anthemic pop',
    },
    notes: [
      '`start_s` 和 `end_s` 均为必填，表示需要重新生成并替换的时间区间。',
      '`version` 仅支持 `v4`、`v4.5+`、`v5`、`v5.5`，默认 `v5.5`。',
      '`infill_lyrics` 是替换段歌词，`prompt` 是上下文歌词，两者含义不同。',
      '任务完成后，从结果 `music[]` 中读取替换后音频的 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: {
        default: 'v5.5',
        description: '仅支持 `v4`、`v4.5+`、`v5`、`v5.5`，默认 `v5.5`。',
      },
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      infill_lyrics: { description: '用于替换指定区间的新歌词。' },
      start_s: { minimum: 0, description: '替换区间起点（秒），必填。' },
      end_s: { minimum: 0, description: '替换区间终点（秒），必填。' },
      prompt: { description: '用于衔接替换段的上下文歌词。' },
      title: { description: '结果标题。' },
      tags: { description: '风格标签。' },
      negative_tags: { description: '需要排除的风格标签。' },
    },
  },
  {
    id: 'suno-sample',
    title: '样本转歌曲',
    enTitle: 'Sample to Song',
    jaTitle: 'サンプルから楽曲生成',
    description: '从已有音轨截取指定范围作为样本，并基于样本生成新歌曲。',
    fields: [
      'version',
      ...sourceFields,
      'start_s',
      'end_s',
      'custom',
      'instrumental',
      'prompt',
      'gpt_description',
      'title',
      'tags',
      'negative_tags',
      'auto_lyrics',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'vocal_gender',
    ],
    required: ['task_id', 'start_s', 'end_s'],
    versions: allVersions,
    example: {
      model: 'suno-sample',
      version: 'v5',
      task_id: 'task_source123',
      audio_index: 1,
      start_s: 5,
      end_s: 25,
      instrumental: true,
      tags: 'ambient electronic',
    },
    notes: [
      '`start_s` 和 `end_s` 必填，表示从源音轨截取样本的时间区间。',
      '`instrumental` 默认 `false`；`version` 支持全部七个版本，默认 `v5.5`。',
      '`custom=true` 时使用歌词和自定义字段；`custom=false` 时 `gpt_description` 必填。省略时根据请求内容推断。',
      '任务完成后，从结果 `music[]` 中读取生成歌曲的 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      version: { default: 'v5.5', description: '生成版本，默认 `v5.5`。' },
      task_id: { description: '源音轨任务 ID，通常为上传样本的任务，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      start_s: { minimum: 0, description: '采样起点（秒），必填。' },
      end_s: { minimum: 0, description: '采样终点（秒），必填。' },
      instrumental: {
        default: false,
        description: '是否生成纯器乐，默认 `false`。',
      },
      custom: {
        description:
          '`true` 为自定义模式，`false` 为灵感模式；省略时自动推断。',
      },
      prompt: { description: '歌词，仅 `custom=true` 时生效。' },
      gpt_description: { description: '灵感提示词，`custom=false` 时必填。' },
      title: { description: '标题，仅 `custom=true` 时生效。' },
      tags: { description: '风格标签，仅 `custom=true` 时生效。' },
      negative_tags: {
        description: '排除的风格标签，仅 `custom=true` 时生效。',
      },
      auto_lyrics: {
        description: '是否对歌词二次创作，仅 `custom=true` 时生效。',
      },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重 0–1，仅自定义模式生效。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意权重 0–1，仅自定义模式生效。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重 0–1，仅自定义模式生效。',
      },
      vocal_gender: {
        enum: ['Male', 'Female'],
        description: '人声性别，两种模式均生效。',
      },
    },
  },
  {
    id: 'suno-inspo',
    title: '灵感生成',
    enTitle: 'Generate from Inspiration',
    jaTitle: 'インスピレーション生成',
    description: '根据 1 至 4 个公开音频 URL 提取灵感并生成新歌曲。',
    fields: [
      'version',
      'audio_urls',
      'prompt',
      'title',
      'tags',
      'negative_tags',
      'style_weight',
      'weirdness_constraint',
      'audio_weight',
      'vocal_gender',
      'auto_lyrics',
    ],
    required: ['audio_urls'],
    versions: ['v4', 'v4.5', 'v4.5+', 'v4.5-all', 'v5', 'v5.5'],
    example: {
      model: 'suno-inspo',
      version: 'v5',
      audio_urls: [
        'https://example.com/reference-1.mp3',
        'https://example.com/reference-2.wav',
      ],
      tags: 'upbeat retro synth pop',
    },
    notes: [
      '本模型直接接收 1–4 个公网音频 URL，不使用 `task_id` 或 `audio_index`。',
      '`version` 支持 `v4`、`v4.5`、`v4.5+`、`v4.5-all`、`v5`、`v5.5`，默认 `v5.5`。',
      '本模型没有 `custom` 模式参数；歌词、标题、标签和权重字段直接生效。',
      '任务完成后，从结果 `music[]` 中读取生成歌曲的 `audio_url`；通常需要 30–120 秒，建议每 3–5 秒查询。',
    ],
    fieldOverrides: {
      audio_urls: {
        minItems: 1,
        maxItems: 4,
        description: '1–4 个公网可访问的参考音频 URL。',
      },
      version: { default: 'v5.5', description: '生成版本，默认 `v5.5`。' },
      prompt: { description: '歌词或内容。' },
      title: { description: '歌曲标题。' },
      tags: { description: '风格标签。' },
      negative_tags: { description: '需要排除的风格标签。' },
      style_weight: {
        minimum: 0,
        maximum: 1,
        description: '风格权重，范围 0–1。',
      },
      weirdness_constraint: {
        minimum: 0,
        maximum: 1,
        description: '创意度权重，范围 0–1。',
      },
      audio_weight: {
        minimum: 0,
        maximum: 1,
        description: '音频权重，范围 0–1。',
      },
      vocal_gender: { enum: ['Male', 'Female'], description: '人声性别。' },
      auto_lyrics: { description: '是否对输入歌词进行二次创作。' },
    },
  },
  {
    id: 'suno-stems',
    title: '分轨提取',
    enTitle: 'Extract Stem',
    jaTitle: 'ステム抽出',
    description: '从已有歌曲中提取指定类型的分轨。',
    fields: [...sourceFields, 'stem_type'],
    required: ['task_id'],
    example: {
      model: 'suno-stems',
      task_id: 'task_source123',
      audio_index: 1,
      stem_type: 'lead_vocal',
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '`stem_type` 省略时默认提取 `lead_vocal`（主人声）。',
      '官方支持 100 多种分轨类型，常用值包括 `lead_vocal`、`backing_vocals`、`drum_kit`、`bass`、`piano`、`electric_guitar`。',
      '任务完成后，结果中包含分离出的音轨 URL；建议每 3–5 秒查询一次公共任务接口。',
    ],
    fieldOverrides: {
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务音轨序号，1-based，默认 `1`。',
      },
      stem_type: {
        default: 'lead_vocal',
        examples: [
          'lead_vocal',
          'backing_vocals',
          'drum_kit',
          'bass',
          'piano',
          'electric_guitar',
        ],
        description:
          '需要提取的分轨类型，默认 `lead_vocal`；支持 100 多种类型。',
      },
    },
  },
  {
    id: 'suno-stems-all',
    title: '全量分轨',
    enTitle: 'Extract All Stems',
    jaTitle: '全ステム抽出',
    description: '从已有歌曲中提取全部可用分轨，适用于混音和后期制作。',
    fields: sourceFields,
    required: ['task_id'],
    example: {
      model: 'suno-stems-all',
      task_id: 'task_source123',
      audio_index: 1,
    },
    notes: [
      '本模型无版本维度，不要传 `version`；即使传入也会被 MAPI 丢弃，不影响计费。',
      '使用产出源音轨的 `task_id` 和 `audio_index` 引用歌曲。',
      '任务完成后，结果中包含分离出的各个音轨 URL。',
      '建议每 3–5 秒查询一次公共任务接口，直到任务成功或失败。',
    ],
    fieldOverrides: {
      task_id: { description: '产出源音轨的任务 ID，必填。' },
      audio_index: {
        default: 1,
        minimum: 1,
        description: '源任务结果 `music[]` 中的音轨序号，1-based，默认 `1`。',
      },
    },
  },
];

const fieldSchemas: Record<FieldName, Record<string, unknown>> = {
  version: {
    type: 'string',
    description:
      'Suno 模型版本。仅支持当前模型文档列出的版本；无版本维度的模型不展示此字段。',
    examples: ['v5'],
  },
  custom: {
    type: 'boolean',
    description: '是否使用自定义创作模式。未传时由上游按该工具规则处理。',
  },
  instrumental: {
    type: 'boolean',
    description: '是否生成纯音乐或按纯音乐方式处理。',
  },
  prompt: {
    type: 'string',
    description: '提示词、歌词或编辑说明，具体语义取决于当前模型。',
  },
  title: { type: 'string', description: '输出作品标题。' },
  tags: {
    type: 'string',
    description: '音乐风格标签，多个标签可使用逗号分隔。',
  },
  style: {
    type: 'string',
    description: '生成音乐使用的风格描述；仅 `suno-music` 使用此字段。',
  },
  negative_tags: {
    type: 'string',
    description: '不希望出现在结果中的风格标签。',
  },
  gpt_description: { type: 'string', description: '自然语言创作或改编说明。' },
  auto_lyrics: {
    type: 'boolean',
    description: '是否让模型自动处理或改写歌词。',
  },
  persona_id: { type: 'string', description: '已创建的 Persona 标识。' },
  vocal_gender: {
    type: 'string',
    description: '期望的人声性别。',
    examples: ['Female'],
  },
  style_weight: {
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: '风格权重，平台接受范围为 0.00–1.00。',
  },
  weirdness_constraint: {
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: '创意度约束，平台接受范围为 0.00–1.00。',
  },
  audio_weight: {
    type: 'number',
    minimum: 0,
    maximum: 1,
    description: '参考音频权重，平台接受范围为 0.00–1.00。',
  },
  task_id: {
    type: 'string',
    description: '源音轨任务 ID。',
    examples: ['task_source123'],
  },
  audio_index: {
    type: 'integer',
    description:
      '源任务结果中的音轨序号，使用 1-based 编号。省略时 MAPI 不会主动填充默认值。',
    examples: [1],
  },
  task_ids: {
    type: 'array',
    minItems: 2,
    maxItems: 2,
    items: { type: 'string' },
    description: '混搭使用的两个源任务 ID，必须且只能包含 2 项。',
  },
  audio_indexes: {
    type: 'array',
    items: { type: 'integer' },
    description: '与 `task_ids` 对应的音轨序号数组。',
  },
  audio_urls: {
    type: 'array',
    minItems: 1,
    maxItems: 4,
    items: { type: 'string', format: 'uri' },
    description: '公开可访问的音频 URL，平台要求 1–4 项。',
  },
  audio_url: {
    type: 'string',
    format: 'uri',
    description: '公开可访问的单个 MP3 或 WAV 音频 URL。',
  },
  start_s: { type: 'number', description: '处理区间的开始时间，单位为秒。' },
  end_s: { type: 'number', description: '处理区间的结束时间，单位为秒。' },
  continue_at: { type: 'integer', description: '从源音轨的第几秒开始续写。' },
  audio_file_path: {
    type: 'string',
    description: '待上传音频的可访问路径或 URL。',
    examples: ['https://example.com/source.mp3'],
  },
  type: {
    type: 'string',
    enum: ['one-shot', 'loop'],
    description: '音效类型：一次性音效或循环音效。',
  },
  bpm: {
    type: 'integer',
    minimum: 1,
    maximum: 300,
    description: '音效速度，平台接受范围为 1–300。',
  },
  key: {
    type: 'string',
    description: '期望的音乐调性。',
    examples: ['C minor'],
  },
  speed: {
    type: 'number',
    minimum: 0.25,
    maximum: 4,
    description: '速度倍率，平台接受范围为 0.25–4。',
  },
  keep_pitch: {
    type: 'boolean',
    description: '调整速度时是否保持音高。省略时 MAPI 不会主动填充默认值。',
  },
  variation_category: {
    type: 'string',
    enum: ['subtle', 'normal', 'high'],
    description: '母带变化程度。',
  },
  stem_type: {
    type: 'string',
    description: '要提取的分轨类型，例如 `lead_vocal`。',
    examples: ['lead_vocal'],
  },
  name: { type: 'string', description: 'Persona 名称。' },
  description: { type: 'string', description: 'Persona 描述。' },
  styles: { type: 'string', description: 'Persona 风格标签。' },
  vox_audio_id: {
    type: 'string',
    description: '用于 Persona 的 Vox 音频标识。',
  },
  vocal_start_s: {
    type: 'number',
    description: '人声片段开始时间，单位为秒。',
  },
  vocal_end_s: { type: 'number', description: '人声片段结束时间，单位为秒。' },
  lyrics_model: {
    type: 'string',
    enum: ['classic', 'remi'],
    description: '歌词生成模式。',
  },
  duration_s: {
    type: 'number',
    description: '淡入或淡出的持续时间，单位为秒。',
  },
  infill_lyrics: { type: 'string', description: '替换段落使用的新歌词。' },
};

const bearerAuth = {
  type: 'http',
  scheme: 'bearer',
  description:
    '使用 MAPI Bearer Token 认证。格式：`Authorization: Bearer sk-xxxxxx`。',
};

const errorSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: '错误代码',
      examples: ['invalid_request'],
    },
    message: { type: 'string', description: '错误说明' },
    data: { description: '错误附加数据，可为空' },
  },
  required: ['code', 'message'],
};

const submitResponseSchema = {
  type: 'object',
  properties: {
    code: { type: 'integer', examples: [200] },
    message: { type: 'string', examples: ['success'] },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['submitted'] },
          task_id: {
            type: 'string',
            description: 'MAPI 公开任务 ID，用于公共查询接口。',
            examples: ['task_aehCmxJ5YUNOIQGgkhvxaco4T9P2h3Dw'],
          },
        },
        required: ['status', 'task_id'],
      },
    },
  },
  required: ['code', 'data'],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSubmitOpenApi(model: ModelDoc) {
  const properties: Record<string, unknown> = {
    model: {
      type: 'string',
      const: model.id,
      description: `固定填写 \`${model.id}\`。`,
      examples: [model.id],
    },
  };
  for (const field of model.fields) {
    const schema = clone(fieldSchemas[field]);
    if (field === 'version' && model.versions) schema.enum = model.versions;
    Object.assign(schema, model.fieldOverrides?.[field] ?? {});
    properties[field] = schema;
  }

  const required = ['model', ...(model.required ?? [])];
  const notes = [
    '所有 Suno 能力均通过 MAPI 公共提交接口调用；模型由请求体中的 `model` 字段区分。',
    '提交成功后立即返回 MAPI 公开任务 ID。请通过 `GET /v1/music/generations/{task_id}` 轮询任务状态。',
    ...(model.notes ?? []),
  ];
  const description = `${model.description}\n\n${notes.map((note) => `- ${note}`).join('\n')}`;

  return {
    openapi: '3.1.0',
    info: { title: model.title, version: '1.0.0', description },
    tags: [{ name: '音频（Audio）/Suno' }],
    components: { securitySchemes: { BearerAuth: bearerAuth } },
    paths: {
      '/v1/music/generations': {
        post: {
          tags: ['音频（Audio）/Suno'],
          summary: model.title,
          description,
          operationId: model.id,
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties,
                  required,
                },
                examples: {
                  [model.id]: { summary: model.title, value: model.example },
                },
              },
            },
          },
          responses: {
            '200': {
              description: '任务提交成功',
              content: {
                'application/json': {
                  schema: submitResponseSchema,
                  example: {
                    code: 200,
                    message: 'success',
                    data: [
                      {
                        status: 'submitted',
                        task_id: 'task_aehCmxJ5YUNOIQGgkhvxaco4T9P2h3Dw',
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: '请求参数错误、模型版本不支持或源任务无效',
              content: {
                'application/json': {
                  schema: errorSchema,
                  example: {
                    code: 'invalid_request',
                    message: 'task_id is required',
                    data: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function createQueryOpenApi() {
  const taskDataProperties = {
    id: { type: 'integer', description: '任务数据库记录 ID' },
    created_at: { type: 'integer', description: '记录创建时间，Unix 秒' },
    updated_at: { type: 'integer', description: '记录更新时间，Unix 秒' },
    task_id: { type: 'string', description: 'MAPI 公开任务 ID' },
    platform: {
      type: 'string',
      description:
        '任务平台标识；APIMart Suno 渠道当前记录为渠道类型字符串 `60`。',
      examples: ['60'],
    },
    user_id: { type: 'integer', description: '所属用户 ID' },
    group: { type: 'string', description: '计费分组' },
    channel_id: { type: 'integer', description: '实际渠道 ID' },
    amount: { type: 'string', description: '人民币计费金额，保留 6 位小数' },
    action: { type: 'string', description: '提交时使用的 `suno-*` 模型 ID' },
    status: {
      type: 'string',
      enum: [
        'NOT_START',
        'SUBMITTED',
        'QUEUED',
        'IN_PROGRESS',
        'SUCCESS',
        'FAILURE',
        'UNKNOWN',
      ],
      description:
        '`SUBMITTED` 表示已提交（上游 `submitted`）；`QUEUED` 表示上游处理中（上游 `pending`）；`SUCCESS` 表示完成；`FAILURE` 表示失败。`IN_PROGRESS` 用于未识别但仍需继续轮询的上游状态。',
    },
    fail_reason: {
      type: 'string',
      description: '失败原因；非失败任务通常为空字符串',
    },
    result_url: {
      type: 'string',
      description:
        '主要结果 URL。音乐任务成功时通常为首个音频 URL；标签增强任务可能为增强后的标签文本。',
    },
    submit_time: { type: 'integer', description: '提交时间，Unix 秒' },
    start_time: { type: 'integer', description: '开始处理时间，Unix 秒' },
    finish_time: { type: 'integer', description: '完成时间，Unix 秒' },
    progress: {
      type: 'string',
      description: '任务进度百分比字符串',
      examples: ['50%'],
    },
    properties: {
      type: 'object',
      description: '任务模型属性',
      properties: {
        input: { type: 'string' },
        upstream_model_name: { type: 'string' },
        origin_model_name: { type: 'string' },
      },
    },
    data: {
      type: 'object',
      description:
        '完整保存的上游查询响应。常见字段包括耗时与计费信息，以及 `data.result.music[]`、`data.result.upsampled_tags`、错误信息等；不同工具的结果结构不同。',
      additionalProperties: true,
    },
  };

  const response = (
    status: string,
    progress: string,
    extra: Record<string, unknown> = {}
  ) => ({
    code: 'success',
    message: '',
    data: {
      id: 1001,
      created_at: 1787018400,
      updated_at: 1787018460,
      task_id: 'task_aehCmxJ5YUNOIQGgkhvxaco4T9P2h3Dw',
      platform: '60',
      user_id: 12,
      group: 'default',
      channel_id: 60,
      amount: '0.730000',
      action: 'suno-music',
      status,
      fail_reason: '',
      submit_time: 1787018400,
      start_time: 1787018410,
      finish_time: 0,
      progress,
      properties: {
        input: '',
        upstream_model_name: 'suno-music',
        origin_model_name: 'suno-music',
      },
      data: {},
      ...extra,
    },
  });

  const description =
    '查询 Suno 异步任务的状态、进度、计费信息和结果。建议每 3–5 秒轮询一次，直到状态变为 `SUCCESS` 或 `FAILURE`。';

  return {
    openapi: '3.1.0',
    info: { title: '查询 Suno 任务', version: '1.0.0', description },
    tags: [{ name: '音频（Audio）/Suno' }],
    components: { securitySchemes: { BearerAuth: bearerAuth } },
    paths: {
      '/v1/music/generations/{task_id}': {
        get: {
          tags: ['音频（Audio）/Suno'],
          summary: '查询 Suno 任务',
          description,
          operationId: 'get-suno-task',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'task_id',
              in: 'path',
              required: true,
              description: '提交接口返回的 MAPI 公开任务 ID',
              schema: { type: 'string' },
              example: 'task_aehCmxJ5YUNOIQGgkhvxaco4T9P2h3Dw',
            },
          ],
          responses: {
            '200': {
              description: '成功获取任务',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', enum: ['success'] },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: taskDataProperties,
                      },
                    },
                    required: ['code', 'data'],
                  },
                  examples: {
                    submitted: {
                      summary: '已提交',
                      value: response('SUBMITTED', '10%'),
                    },
                    queued: {
                      summary: '排队中',
                      value: response('QUEUED', '50%'),
                    },
                    processing: {
                      summary: '其他处理中状态',
                      value: response('IN_PROGRESS', '70%'),
                    },
                    successMusic: {
                      summary: '音乐任务成功',
                      value: response('SUCCESS', '100%', {
                        finish_time: 1787018520,
                        result_url: 'https://example.com/generated-song.mp3',
                        data: {
                          code: 200,
                          data: {
                            id: 'upstream-task',
                            status: 'completed',
                            progress: 100,
                            actual_time: 161,
                            estimated_time: 180,
                            cost: 0.05,
                            credits_cost: 0.5,
                            result: {
                              music: [
                                {
                                  audio_id: 'audio_01',
                                  title: 'Summer Breeze',
                                  duration: 128.5,
                                  lyrics: '...',
                                  tags: 'electronic, upbeat',
                                  audio_url:
                                    'https://example.com/generated-song.mp3',
                                  image_url: 'https://example.com/cover.png',
                                  image_large_url:
                                    'https://example.com/cover-large.png',
                                  video_url:
                                    'https://example.com/music-video.mp4',
                                  status: 'complete',
                                },
                              ],
                            },
                          },
                        },
                      }),
                    },
                    successTags: {
                      summary: '标签增强任务成功',
                      value: response('SUCCESS', '100%', {
                        finish_time: 1787018450,
                        result_url:
                          'lo-fi hip hop, warm vinyl, rainy night, mellow piano',
                        action: 'suno-upsample-tags',
                        data: {
                          code: 200,
                          data: {
                            id: 'upstream-task',
                            status: 'completed',
                            progress: 100,
                            result: {
                              upsampled_tags:
                                'lo-fi hip hop, warm vinyl, rainy night, mellow piano',
                            },
                          },
                        },
                      }),
                    },
                    failed: {
                      summary: '任务失败',
                      value: response('FAILURE', '100%', {
                        finish_time: 1787018450,
                        fail_reason: 'source task is not ready',
                        data: {
                          code: 200,
                          data: {
                            id: 'upstream-task',
                            status: 'failed',
                            progress: 100,
                            result: {},
                            error: { message: 'source task is not ready' },
                          },
                        },
                      }),
                    },
                  },
                },
              },
            },
            '400': {
              description: '任务不存在或任务不属于当前用户',
              content: {
                'application/json': {
                  schema: errorSchema,
                  example: {
                    code: 'task_not_exist',
                    message: 'task_not_exist',
                    data: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function jsonFileName(id: string) {
  return id === 'get-suno-task'
    ? 'get-v1-music-generations-task-id.json'
    : `post-v1-music-generations-${id}.json`;
}

function mdxContent(
  title: string,
  description: string,
  operationId: string,
  method: 'POST' | 'GET'
) {
  const document = `openapi/generated/ai-model/音频（Audio）/Suno/${jsonFileName(operationId)}`;
  const apiPath =
    method === 'POST'
      ? '/v1/music/generations'
      : '/v1/music/generations/{task_id}';
  return `---
title: ${title}
full: true
---

${description}

<APIPage document={"${document}"} operations={[{"path":"${apiPath}","method":"${method.toLowerCase()}"}]} />
`;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function generate() {
  const root = process.cwd();
  const openApiDir = path.join(
    root,
    'openapi/generated/ai-model/音频（Audio）/Suno'
  );
  await mkdir(openApiDir, { recursive: true });

  for (const model of models) {
    await writeJson(
      path.join(openApiDir, jsonFileName(model.id)),
      createSubmitOpenApi(model)
    );
  }
  await writeJson(
    path.join(openApiDir, jsonFileName('get-suno-task')),
    createQueryOpenApi()
  );

  const locales = [
    {
      locale: 'zh',
      metaTitle: 'Suno',
      title: (model: ModelDoc) => model.title,
      description: (model: ModelDoc) => {
        const details = (model.notes ?? [])
          .map((note) => `- ${note}`)
          .join('\n');
        return `- ${model.description}
${details ? `\n${details}` : ''}

- **提交接口**：统一通过 \`POST /v1/music/generations\` 提交，使用 \`model: "${model.id}"\` 选择此能力。
- **任务查询**：提交返回 \`task_id\`，通过 \`GET /v1/music/generations/{task_id}\` 获取任务状态和结果。`;
      },
      queryTitle: '查询 Suno 任务',
      queryDescription:
        '通过公共接口 `GET /v1/music/generations/{task_id}` 查询所有 Suno 模型的异步任务。',
    },
    {
      locale: 'en',
      metaTitle: 'Suno',
      title: (model: ModelDoc) => model.enTitle,
      description: (model: ModelDoc) =>
        `Submit this Suno capability through \`POST /v1/music/generations\` with \`model: "${model.id}"\`.`,
      queryTitle: 'Get Suno Task',
      queryDescription:
        'Query any asynchronous Suno task through `GET /v1/music/generations/{task_id}`.',
    },
    {
      locale: 'ja',
      metaTitle: 'Suno',
      title: (model: ModelDoc) => model.jaTitle,
      description: (model: ModelDoc) =>
        `\`POST /v1/music/generations\` に \`model: "${model.id}"\` を指定して送信します。`,
      queryTitle: 'Sunoタスク照会',
      queryDescription:
        '`GET /v1/music/generations/{task_id}` ですべてのSuno非同期タスクを照会します。',
    },
  ];

  const pages = [...models.map((model) => model.id), 'get-suno-task'];
  for (const locale of locales) {
    const docsDir = path.join(
      root,
      `content/docs/${locale.locale}/api/ai-model/audio/suno`
    );
    await mkdir(docsDir, { recursive: true });
    await writeJson(path.join(docsDir, 'meta.json'), {
      title: locale.metaTitle,
      pages,
    });
    for (const model of models) {
      await writeFile(
        path.join(docsDir, `${model.id}.mdx`),
        mdxContent(
          locale.title(model),
          locale.description(model),
          model.id,
          'POST'
        ),
        'utf8'
      );
    }
    await writeFile(
      path.join(docsDir, 'get-suno-task.mdx'),
      mdxContent(
        locale.queryTitle,
        locale.queryDescription,
        'get-suno-task',
        'GET'
      ),
      'utf8'
    );
  }

  console.log(`Generated ${models.length} Suno model docs and one query doc.`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});

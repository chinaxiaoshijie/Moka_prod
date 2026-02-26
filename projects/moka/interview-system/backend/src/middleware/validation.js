const Joi = require('joi');
const { responseUtils } = require('../utils/helpers');

// 通用验证中间件
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      allowUnknown: false, // 不允许未知字段
      stripUnknown: true // 删除未知字段
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return responseUtils.error(res, '参数验证失败', 400, errorMessages);
    }

    next();
  };
};

// 用户相关验证规则
const userSchemas = {
  // 用户注册验证
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多30个字符',
        'any.required': '用户名是必填项'
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      .required()
      .messages({
        'string.min': '密码至少8个字符',
        'string.pattern.base': '密码必须包含至少一个字母和一个数字',
        'any.required': '密码是必填项'
      }),

    role: Joi.string()
      .valid('admin', 'hr', 'interviewer')
      .default('interviewer')
      .messages({
        'any.only': '角色必须是admin、hr或interviewer之一'
      }),

    department: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': '部门名称最多100个字符'
      })
  }),

  // 用户登录验证
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码是必填项'
      })
  }),

  // 用户信息更新验证
  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多30个字符'
      }),

    department: Joi.string()
      .max(100)
      .allow('')
      .messages({
        'string.max': '部门名称最多100个字符'
      })
  }),

  // 密码修改验证
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': '当前密码是必填项'
      }),

    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      .required()
      .messages({
        'string.min': '新密码至少8个字符',
        'string.pattern.base': '新密码必须包含至少一个字母和一个数字',
        'any.required': '新密码是必填项'
      })
  })
};

// 候选人相关验证规则
const candidateSchemas = {
  // 创建候选人验证
  create: Joi.object({
    name: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': '姓名最多100个字符',
        'any.required': '姓名是必填项'
      }),

    email: Joi.string()
      .email()
      .allow(null, '')
      .messages({
        'string.email': '请输入有效的邮箱地址'
      }),

    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .allow(null, '')
      .messages({
        'string.pattern.base': '请输入有效的手机号码'
      }),

    gender: Joi.string()
      .valid('male', 'female', 'other')
      .allow('', null)
      .messages({
        'any.only': '性别必须是male、female或other之一'
      }),

    age: Joi.number()
      .integer()
      .min(16)
      .max(70)
      .allow(null, '')
      .messages({
        'number.min': '年龄不能小于16岁',
        'number.max': '年龄不能大于70岁'
      }),

    education: Joi.string()
      .valid('high_school', 'associate', 'bachelor', 'master', 'doctor')
      .allow('', null)
      .messages({
        'any.only': '学历必须是指定的有效值'
      }),

    experience_years: Joi.number()
      .integer()
      .min(0)
      .max(50)
      .allow(null, '')
      .messages({
        'number.min': '工作年限不能为负数',
        'number.max': '工作年限不能超过50年'
      }),

    skills: Joi.string()
      .max(1000)
      .allow('', null)
      .messages({
        'string.max': '技能描述最多1000个字符'
      }),

    source: Joi.string()
      .valid('boss', 'lagou', 'zhilian', 'internal', 'referral', 'manual')
      .default('manual')
      .messages({
        'any.only': '简历来源必须是指定的有效值'
      }),

    notes: Joi.string()
      .max(2000)
      .allow('', null)
      .messages({
        'string.max': '备注最多2000个字符'
      })
  }).custom((value, helpers) => {
    // 自定义验证: email和phone至少需要一个
    const email = value.email;
    const phone = value.phone;

    const hasEmail = email && email.trim() !== '' && email !== null;
    const hasPhone = phone && phone.trim() !== '' && phone !== null;

    if (!hasEmail && !hasPhone) {
      return helpers.error('any.required', {
        message: '邮箱和手机号必须至少填写一项'
      });
    }

    return value;
  }),

  // 更新候选人验证
  update: Joi.object({
    name: Joi.string()
      .max(100)
      .messages({
        'string.max': '姓名最多100个字符'
      }),

    email: Joi.string()
      .email()
      .allow('')
      .messages({
        'string.email': '请输入有效的邮箱地址'
      }),

    phone: Joi.string()
      .pattern(/^1[3-9]\d{9}$/)
      .allow('')
      .messages({
        'string.pattern.base': '请输入有效的手机号码'
      }),

    status: Joi.string()
      .valid('new', 'screening', 'interviewing', 'offer', 'hired', 'rejected')
      .messages({
        'any.only': '状态必须是指定的有效值'
      }),

    gender: Joi.string()
      .valid('male', 'female', 'other')
      .allow('')
      .messages({
        'any.only': '性别必须是male、female或other之一'
      }),

    age: Joi.number()
      .integer()
      .min(16)
      .max(70)
      .allow(null)
      .messages({
        'number.min': '年龄不能小于16岁',
        'number.max': '年龄不能大于70岁'
      }),

    education: Joi.string()
      .valid('high_school', 'associate', 'bachelor', 'master', 'doctor')
      .allow('')
      .messages({
        'any.only': '学历必须是指定的有效值'
      }),

    experience_years: Joi.number()
      .integer()
      .min(0)
      .max(50)
      .allow(null)
      .messages({
        'number.min': '工作年限不能为负数',
        'number.max': '工作年限不能超过50年'
      }),

    skills: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '技能描述最多1000个字符'
      }),

    notes: Joi.string()
      .max(2000)
      .allow('')
      .messages({
        'string.max': '备注最多2000个字符'
      })
  })
};

// 面试相关验证规则
const interviewSchemas = {
  // 创建面试验证
  create: Joi.object({
    candidate_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.positive': '候选人ID必须是正整数',
        'any.required': '候选人ID是必填项'
      }),

    position_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.positive': '职位ID必须是正整数',
        'any.required': '职位ID是必填项'
      }),

    interviewer_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.positive': '面试官ID必须是正整数',
        'any.required': '面试官ID是必填项'
      }),

    interviewer_name: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': '面试官姓名最多100个字符',
        'any.required': '面试官姓名是必填项'
      }),

    scheduled_time: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': '面试时间不能早于当前时间',
        'any.required': '面试时间是必填项'
      }),

    duration: Joi.number()
      .integer()
      .min(15)
      .max(240)
      .default(60)
      .messages({
        'number.min': '面试时长不能少于15分钟',
        'number.max': '面试时长不能超过240分钟'
      }),

    location: Joi.string()
      .max(200)
      .allow('')
      .messages({
        'string.max': '面试地点最多200个字符'
      }),

    meeting_link: Joi.string()
      .uri()
      .allow('')
      .messages({
        'string.uri': '请输入有效的会议链接'
      }),

    interview_type: Joi.string()
      .valid('phone', 'video', 'onsite')
      .required()
      .messages({
        'any.only': '面试类型必须是phone、video或onsite',
        'any.required': '面试类型是必填项'
      }),

    interview_round: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .default(1)
      .messages({
        'number.min': '面试轮次不能小于1',
        'number.max': '面试轮次不能大于5'
      }),

    notes: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '备注最多1000个字符'
      })
  }),

  // 更新面试验证
  update: Joi.object({
    scheduled_time: Joi.date()
      .min('now')
      .messages({
        'date.min': '面试时间不能早于当前时间'
      }),

    duration: Joi.number()
      .integer()
      .min(15)
      .max(240)
      .messages({
        'number.min': '面试时长不能少于15分钟',
        'number.max': '面试时长不能超过240分钟'
      }),

    location: Joi.string()
      .max(200)
      .allow('')
      .messages({
        'string.max': '面试地点最多200个字符'
      }),

    meeting_link: Joi.string()
      .uri()
      .allow('')
      .messages({
        'string.uri': '请输入有效的会议链接'
      }),

    interview_type: Joi.string()
      .valid('phone', 'video', 'onsite')
      .messages({
        'any.only': '面试类型必须是phone、video或onsite'
      }),

    status: Joi.string()
      .valid('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')
      .messages({
        'any.only': '状态必须是指定的有效值'
      }),

    notes: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '备注最多1000个字符'
      }),

    feedback: Joi.string()
      .max(2000)
      .allow('')
      .messages({
        'string.max': '反馈最多2000个字符'
      }),

    score: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .messages({
        'number.min': '评分不能小于1',
        'number.max': '评分不能大于10'
      }),

    result: Joi.string()
      .valid('pass', 'fail', 'pending')
      .allow('')
      .messages({
        'any.only': '结果必须是pass、fail或pending'
      })
  }),

  // 面试反馈验证
  feedback: Joi.object({
    feedback: Joi.string()
      .max(2000)
      .required()
      .messages({
        'string.max': '反馈最多2000个字符',
        'any.required': '反馈是必填项'
      }),

    score: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.min': '评分不能小于1',
        'number.max': '评分不能大于10',
        'any.required': '评分是必填项'
      }),

    result: Joi.string()
      .valid('pass', 'fail', 'pending')
      .required()
      .messages({
        'any.only': '结果必须是pass、fail或pending',
        'any.required': '结果是必填项'
      })
  }),

  // 状态更新验证
  status: Joi.object({
    status: Joi.string()
      .valid('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')
      .required()
      .messages({
        'any.only': '状态必须是指定的有效值',
        'any.required': '状态是必填项'
      }),

    notes: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '备注最多1000个字符'
      })
  }),

  // 批量创建面试验证
  batchCreate: Joi.object({
    interviews: Joi.array()
      .items(
        Joi.object({
          candidate_id: Joi.number().integer().positive().required(),
          position_id: Joi.number().integer().positive().required(),
          interviewer_id: Joi.number().integer().positive().required(),
          interviewer_name: Joi.string().max(100).required(),
          scheduled_time: Joi.date().min('now').required(),
          duration: Joi.number().integer().min(15).max(240).default(60),
          location: Joi.string().max(200).allow(''),
          meeting_link: Joi.string().uri().allow(''),
          interview_type: Joi.string().valid('phone', 'video', 'onsite').required(),
          interview_round: Joi.number().integer().min(1).max(5).default(1),
          notes: Joi.string().max(1000).allow('')
        })
      )
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': '至少需要一个面试',
        'array.max': '最多只能批量创建10个面试',
        'any.required': '面试列表是必填项'
      })
  })
};

// 反馈相关验证规则
const feedbackSchemas = {
  // 创建反馈验证
  create: Joi.object({
    interview_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.positive': '面试ID必须是正整数',
        'any.required': '面试ID是必填项'
      }),

    overall_rating: Joi.string()
      .valid('very_unsatisfied', 'unsatisfied', 'neutral', 'satisfied', 'very_satisfied')
      .required()
      .messages({
        'any.only': '总体评价必须是指定的有效值',
        'any.required': '总体评价是必填项'
      }),

    technical_score: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .messages({
        'number.min': '技术评分不能小于1',
        'number.max': '技术评分不能大于10'
      }),

    communication_score: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .messages({
        'number.min': '沟通评分不能小于1',
        'number.max': '沟通评分不能大于10'
      }),

    overall_score: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .allow(null)
      .messages({
        'number.min': '综合评分不能小于1',
        'number.max': '综合评分不能大于10'
      }),

    strengths: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '优势描述最多1000个字符'
      }),

    weaknesses: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '劣势描述最多1000个字符'
      }),

    recommendation: Joi.string()
      .valid('strong_hire', 'hire', 'no_hire', 'strong_no_hire')
      .required()
      .messages({
        'any.only': '推荐结果必须是指定的有效值',
        'any.required': '推荐结果是必填项'
      }),

    comments: Joi.string()
      .max(2000)
      .allow('')
      .messages({
        'string.max': '评论最多2000个字符'
      })
  })
};

// 职位相关验证规则
const positionSchemas = {
  // 创建职位验证
  create: Joi.object({
    title: Joi.string()
      .max(200)
      .required()
      .messages({
        'string.max': '职位标题最多200个字符',
        'any.required': '职位标题是必填项'
      }),

    department: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': '部门名称最多100个字符',
        'any.required': '部门是必填项'
      }),

    level: Joi.string()
      .valid('junior', 'middle', 'senior', 'expert', 'manager')
      .required()
      .messages({
        'any.only': '职位级别必须是指定的有效值',
        'any.required': '职位级别是必填项'
      }),

    type: Joi.string()
      .valid('fulltime', 'parttime', 'intern', 'contract')
      .required()
      .messages({
        'any.only': '职位类型必须是指定的有效值',
        'any.required': '职位类型是必填项'
      }),

    location: Joi.string()
      .max(200)
      .allow('')
      .messages({
        'string.max': '工作地点最多200个字符'
      }),

    salary_min: Joi.number()
      .integer()
      .min(0)
      .allow(null)
      .messages({
        'number.min': '最低薪资不能为负数'
      }),

    salary_max: Joi.number()
      .integer()
      .min(0)
      .allow(null)
      .messages({
        'number.min': '最高薪资不能为负数'
      }),

    description: Joi.string()
      .max(5000)
      .allow('')
      .messages({
        'string.max': '职位描述最多5000个字符'
      }),

    requirements: Joi.string()
      .max(5000)
      .allow('')
      .messages({
        'string.max': '任职要求最多5000个字符'
      }),

    benefits: Joi.string()
      .max(2000)
      .allow('')
      .messages({
        'string.max': '福利待遇最多2000个字符'
      }),

    skills_required: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '技能要求最多1000个字符'
      }),

    status: Joi.string()
      .valid('active', 'paused', 'closed', 'draft')
      .default('draft')
      .messages({
        'any.only': '职位状态必须是指定的有效值'
      }),

    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium')
      .messages({
        'any.only': '优先级必须是指定的有效值'
      }),

    headcount: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        'number.min': '招聘人数不能小于1',
        'number.max': '招聘人数不能超过100'
      }),

    expire_date: Joi.date()
      .min('now')
      .allow(null)
      .messages({
        'date.min': '过期时间不能早于当前时间'
      })
  }),

  // 更新职位验证
  update: Joi.object({
    title: Joi.string()
      .max(200)
      .messages({
        'string.max': '职位标题最多200个字符'
      }),

    department: Joi.string()
      .max(100)
      .messages({
        'string.max': '部门名称最多100个字符'
      }),

    level: Joi.string()
      .valid('junior', 'middle', 'senior', 'expert', 'manager')
      .messages({
        'any.only': '职位级别必须是指定的有效值'
      }),

    type: Joi.string()
      .valid('fulltime', 'parttime', 'intern', 'contract')
      .messages({
        'any.only': '职位类型必须是指定的有效值'
      }),

    location: Joi.string()
      .max(200)
      .allow('')
      .messages({
        'string.max': '工作地点最多200个字符'
      }),

    salary_min: Joi.number()
      .integer()
      .min(0)
      .allow(null)
      .messages({
        'number.min': '最低薪资不能为负数'
      }),

    salary_max: Joi.number()
      .integer()
      .min(0)
      .allow(null)
      .messages({
        'number.min': '最高薪资不能为负数'
      }),

    description: Joi.string()
      .max(5000)
      .allow('')
      .messages({
        'string.max': '职位描述最多5000个字符'
      }),

    requirements: Joi.string()
      .max(5000)
      .allow('')
      .messages({
        'string.max': '任职要求最多5000个字符'
      }),

    benefits: Joi.string()
      .max(2000)
      .allow('')
      .messages({
        'string.max': '福利待遇最多2000个字符'
      }),

    skills_required: Joi.string()
      .max(1000)
      .allow('')
      .messages({
        'string.max': '技能要求最多1000个字符'
      }),

    status: Joi.string()
      .valid('active', 'paused', 'closed', 'draft')
      .messages({
        'any.only': '职位状态必须是指定的有效值'
      }),

    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .messages({
        'any.only': '优先级必须是指定的有效值'
      }),

    headcount: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .messages({
        'number.min': '招聘人数不能小于1',
        'number.max': '招聘人数不能超过100'
      }),

    expire_date: Joi.date()
      .min('now')
      .allow(null)
      .messages({
        'date.min': '过期时间不能早于当前时间'
      })
  }),

  // 状态更新验证
  status: Joi.object({
    status: Joi.string()
      .valid('active', 'paused', 'closed', 'draft')
      .required()
      .messages({
        'any.only': '状态必须是指定的有效值',
        'any.required': '状态是必填项'
      }),

    reason: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': '状态变更原因最多500个字符'
      })
  })
};

module.exports = {
  validate,
  userSchemas,
  candidateSchemas,
  interviewSchemas,
  positionSchemas,
  feedbackSchemas
};
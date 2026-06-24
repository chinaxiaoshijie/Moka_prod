#!/bin/bash
# 修复 class-validator IsEnum 问题

# 1. 修复 user.dto.ts - 使用 IsIn 替代 IsEnum
sed -i 's/@IsEnum(\[HR, INTERVIEWER\])/@IsIn([HR, INTERVIEWER])/g' src/users/dto/user.dto.ts
sed -i 's/import {/import { IsIn,/g' src/users/dto/user.dto.ts

# 2. 修复 candidate.dto.ts - 使用 IsIn 替代 IsEnum
sed -i 's/@IsEnum(CANDIDATE_STATUS_VALUES, {/@IsIn(CANDIDATE_STATUS_VALUES, {/g' src/candidates/dto/candidate.dto.ts
sed -i 's/@IsEnum(CANDIDATE_SOURCE_VALUES, {/@IsIn(CANDIDATE_SOURCE_VALUES, {/g' src/candidates/dto/candidate.dto.ts
sed -i 's/import { IsString, IsOptional, IsInt, IsEnum }/import { IsString, IsOptional, IsInt, IsIn }/g' src/candidates/dto/candidate.dto.ts

# 3. 修复 feedback.dto.ts
sed -i 's/@IsEnum(FEEDBACK_RESULT_VALUES, {/@IsIn(FEEDBACK_RESULT_VALUES, {/g' src/feedback/dto/feedback.dto.ts
sed -i 's/import { IsString, IsOptional, IsEnum, IsInt, Min, Max }/import { IsString, IsOptional, IsIn, IsInt, Min, Max }/g' src/feedback/dto/feedback.dto.ts

# 4. 修复 interview.dto.ts
sed -i 's/@IsEnum(INTERVIEW_TYPE_VALUES, {/@IsIn(INTERVIEW_TYPE_VALUES, {/g' src/interviews/dto/interview.dto.ts
sed -i 's/@IsEnum(INTERVIEW_FORMAT_VALUES, {/@IsIn(INTERVIEW_FORMAT_VALUES, {/g' src/interviews/dto/interview.dto.ts
sed -i 's/@IsEnum(INTERVIEW_STATUS_VALUES, {/@IsIn(INTERVIEW_STATUS_VALUES, {/g' src/interviews/dto/interview.dto.ts
sed -i 's/import { IsString, IsOptional, IsEnum, IsDateString, IsInt }/import { IsString, IsOptional, IsIn, IsDateString, IsInt }/g' src/interviews/dto/interview.dto.ts

# 5. 修复 notification.dto.ts
sed -i 's/@IsEnum(NOTIFICATION_TYPE_VALUES, {/@IsIn(NOTIFICATION_TYPE_VALUES, {/g' src/notifications/dto/notification.dto.ts
sed -i 's/import { IsString, IsOptional, IsEnum, IsBoolean }/import { IsString, IsOptional, IsIn, IsBoolean }/g' src/notifications/dto/notification.dto.ts

echo ✅ 枚举验证器已修复

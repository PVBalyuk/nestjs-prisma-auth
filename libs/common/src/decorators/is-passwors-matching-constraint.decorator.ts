import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { RegisterDto } from '@auth/dto';

@ValidatorConstraint({ name: 'IsPasswordsMathing', async: false })
export class IsPasswordsMathingConstraint
  implements ValidatorConstraintInterface
{
  validate(
    confirmationPassword: string,
    args: ValidationArguments,
  ): boolean | Promise<boolean> {
    const obj = args.object as RegisterDto;
    return obj.password === confirmationPassword;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Пароли не совпадают';
  }
}

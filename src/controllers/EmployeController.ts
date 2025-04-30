import { Request, Response } from 'express';
import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';
import { CustomRequest } from '../middleware/authMiddleware';
import EmployeRepository from '../repositories/EmployeRepository';
import { handleHttpError } from '../services/ErrorService';
import { BadRequestError } from '../Errors/BadRequestError';
import { isValidEmail } from '../services/Email';
import { permissionsEnum } from '../enums/permissionsEnum';
import { NotFoundError } from '../Errors/NotFoundError';
import RoleModel from '../models/RoleModel';
import bcrypt from 'bcrypt';
import AccountRoleModel from '../models/AccountRoleModel';
import { generateRandomPassword } from '../services/AuthService';
import { UnauthorizedError } from '../Errors/UnauthorizedError';

export const disableEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as CustomRequest;

        if (!(await EmployeRepository.checkPermission(user.id, permissionsEnum.DISABLE_EMPLOYEE))) {
          throw new UnauthorizedError(ErrorEnum.UNAUTHORIZED);
      }

        const id = parseInt(req.params.id, 10);
        const employee = await AccountModel.findByPk(id);
        
        if (!employee) {
          throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
      }
        
        await employee.update({ archivedAt: new Date() });
        res.status(204).send();
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};

export const activateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
      const { user } = req as CustomRequest;

      if (!(await EmployeRepository.checkPermission(user.id, permissionsEnum.DISABLE_EMPLOYEE))) {
        throw new UnauthorizedError(ErrorEnum.UNAUTHORIZED);
      }

      const id = parseInt(req.params.id, 10);
      const employee = await AccountModel.findByPk(id);
      
      if (!employee) {
        throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
      }
      
      await employee.update({ archivedAt: null });
      res.status(204).send();
  } catch (error: unknown) {
      handleHttpError(error, res);
  }
};


export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter = req.query.status as 'all' | 'active' | 'inactive' | 'online' | undefined;
        const employees = await EmployeRepository.getAll(filter);

        const safeEmployees = employees.map(employee => {
            const { password, ...safeData } = employee.get({ plain: true });
            return safeData;
        });

        res.status(200).json(safeEmployees);
        return;
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const numericId = Number(id);
        if (isNaN(numericId)) {
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND)
        }

        const [employee, roles] = await EmployeRepository.getById(numericId);

        if (!employee) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        let { password, ...safeEmployee } = employee.get({ plain: true });
        safeEmployee['roles'] = roles;

        res.status(200).json(safeEmployee);
        return;
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const updateData = req.body;

        
        const numericId = Number(id);
        if (isNaN(numericId)) {
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            throw new BadRequestError(ErrorEnum.UPDATE_EMPTY);
        }

        if (updateData.email && !isValidEmail(updateData.email)) {
            throw new BadRequestError(ErrorEnum.UPDATE_EMPTY);
        }
        const updatedEmployee = await EmployeRepository.update(numericId, updateData);

        if (!updatedEmployee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(updatedEmployee);
        return;
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};
export const createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        city,
        postalCode,
        countryCode,
        isGpsTrackingAllowed,
        notificationMail,
        notificationSms,
        archivedAt,
        roleIds
      } = req.body;
  
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phoneNumber ||
        !address ||
        !city ||
        !postalCode ||
        !countryCode ||
        isGpsTrackingAllowed === undefined ||
        notificationMail === undefined ||
        notificationSms === undefined ||
        archivedAt === undefined
      ) {
        throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
      }
      if (!isValidEmail(email)) {
        throw new BadRequestError(ErrorEnum.INVALID_EMAIL);
      }
  
      const existingUser = await AccountModel.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestError(ErrorEnum.EMAIL_ALREADY_USED);
      }
  
      const rawPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
      const newEmployee = await AccountModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        city,
        postalCode,
        countryCode,
        isGpsTrackingAllowed,
        notificationMail,
        notificationSms,
        archivedAt,
      });
  
      if (Array.isArray(roleIds) && roleIds.length > 0) {
        const roles = await RoleModel.findAll({ where: { id: roleIds } });
  
        if (roles.length !== roleIds.length) {
          throw new BadRequestError(ErrorEnum.ROLE_NOT_FOUND);
        }
  
        const accountRoles = roleIds.map((roleId: number) => ({
          idAccount: newEmployee.id,
          idRole: roleId,
        }));
  
        await AccountRoleModel.bulkCreate(accountRoles);
      }
  
      res.status(201).json({
        message: 'Employé créé avec succès',
        employee: {
          id: newEmployee.id,
          firstName: newEmployee.firstName,
          lastName: newEmployee.lastName,
          email: newEmployee.email
        },
      });
    } catch (error: unknown) {
      handleHttpError(error, res);
    }
  };
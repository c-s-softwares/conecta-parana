import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'data/forgot_password_repository.dart';

class ForgotPasswordController extends ChangeNotifier {
  final ForgotPasswordRepository _repository;

  ForgotPasswordController({ForgotPasswordRepository? repository})
    : _repository = repository ?? ForgotPasswordRepository.create();

  final PageController pageController = PageController();
  int currentStep = 0;

  String _email = '';
  String _code = '';
  String _newPassword = '';
  String _confirmPassword = '';
  bool isPasswordVisible = false;
  bool isConfirmPasswordVisible = false;
  bool isLoading = false;
  String? errorMessage;
  bool weakPasswordError = false;
  int resendCooldown = 0;

  Timer? _cooldownTimer;
  bool _disposed = false;

  void togglePasswordVisibility() {
    isPasswordVisible = !isPasswordVisible;
    notifyListeners();
  }

  void toggleConfirmPasswordVisibility() {
    isConfirmPasswordVisible = !isConfirmPasswordVisible;
    notifyListeners();
  }

  String get email => _email;
  set email(String value) {
    _email = value;
    notifyListeners();
  }

  String get code => _code;
  set code(String value) {
    _code = value;
    notifyListeners();
  }

  String get newPassword => _newPassword;
  set newPassword(String value) {
    _newPassword = value;
    weakPasswordError = false;
    notifyListeners();
  }

  String get confirmPassword => _confirmPassword;
  set confirmPassword(String value) {
    _confirmPassword = value;
    notifyListeners();
  }

  bool get isEmailValid =>
      RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);

  bool get hasMinLength => _newPassword.length >= 8;
  bool get hasUppercase => RegExp(r'[A-Z]').hasMatch(_newPassword);
  bool get hasNumber => RegExp(r'[0-9]').hasMatch(_newPassword);
  bool get hasSymbol => RegExp(r'[!@#\$&*~_=+|-]').hasMatch(_newPassword);

  bool get isPasswordValid =>
      hasMinLength && hasUppercase && hasNumber && hasSymbol;
  bool get passwordsMatch =>
      newPassword == confirmPassword && newPassword.isNotEmpty;

  void nextStep() {
    if (currentStep < 2) {
      currentStep++;
      errorMessage = null;
      _animateToCurrentStep();
    }
  }

  void previousStep() {
    if (currentStep > 0) {
      currentStep--;
      errorMessage = null;
      _animateToCurrentStep();
    }
  }

  void _animateToCurrentStep() {
    pageController.animateToPage(
      currentStep,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    notifyListeners();
  }

  void startCooldown() {
    _cooldownTimer?.cancel();
    resendCooldown = 60;
    notifyListeners();

    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_disposed) {
        timer.cancel();
        return;
      }
      resendCooldown--;
      notifyListeners();
      if (resendCooldown <= 0) {
        timer.cancel();
      }
    });
  }

  Future<bool> submitEmail() async {
    if (!isEmailValid) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _repository.forgotPassword(email: email);
      isLoading = false;
      nextStep();
      startCooldown();
      return true;
    } on DioException catch (e) {
      isLoading = false;
      if (e.response?.statusCode == 429) {
        startCooldown();
      }
      notifyListeners();
      return false;
    }
  }

  Future<void> resendCode() async {
    if (resendCooldown > 0) return;
    errorMessage = null;
    notifyListeners();

    try {
      await _repository.forgotPassword(email: email);
      startCooldown();
    } on DioException catch (e) {
      if (e.response?.statusCode == 429) {
        startCooldown();
      }
      notifyListeners();
    }
  }

  Future<void> verifyCode() async {
    if (code.length < 6) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _repository.verifyCode(email: email, code: code);
      isLoading = false;
      nextStep();
    } on ForgotPasswordException catch (e) {
      isLoading = false;
      if (e.type == ForgotPasswordError.invalidOrExpiredCode) {
        errorMessage = 'Código inválido ou expirado. Solicite um novo.';
      } else {
        errorMessage = 'Erro ao verificar código. Tente novamente.';
      }
      notifyListeners();
    }
  }

  Future<bool> resetPassword() async {
    if (!isPasswordValid || !passwordsMatch) return false;
    isLoading = true;
    errorMessage = null;
    weakPasswordError = false;
    notifyListeners();

    try {
      await _repository.resetPassword(
        email: email,
        code: code,
        newPassword: newPassword,
      );
      isLoading = false;
      notifyListeners();
      return true;
    } on ForgotPasswordException catch (e) {
      isLoading = false;
      if (e.type == ForgotPasswordError.invalidOrExpiredCode) {
        currentStep = 1;
        errorMessage = 'Código inválido. Solicite um novo.';
        _animateToCurrentStep();
      } else if (e.type == ForgotPasswordError.weakPassword) {
        weakPasswordError = true;
        notifyListeners();
      } else {
        errorMessage = 'Erro inesperado. Tente novamente.';
        notifyListeners();
      }
      return false;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _cooldownTimer?.cancel();
    pageController.dispose();
    super.dispose();
  }
}
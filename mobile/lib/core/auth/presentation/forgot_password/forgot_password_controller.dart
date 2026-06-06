import 'package:flutter/material.dart';

class ForgotPasswordController extends ChangeNotifier {
  final PageController pageController = PageController();
  int currentStep = 0;

  String _email = '';
  String _code = '';
  String _newPassword = '';
  String _confirmPassword = '';

  bool isPasswordVisible = false;
  bool isConfirmPasswordVisible = false;

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
    notifyListeners();
  }

  String get confirmPassword => _confirmPassword;
  set confirmPassword(String value) {
    _confirmPassword = value;
    notifyListeners();
  }

  bool isLoading = false;
  String? errorMessage;
  int resendCooldown = 0;

  Future<void> startCooldown() async {
    resendCooldown = 60;
    notifyListeners();

    while (resendCooldown > 0) {
      await Future.delayed(const Duration(seconds: 1));
      resendCooldown--;
      notifyListeners();
    }
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

  Future<void> submitEmail() async {
    if (!isEmailValid) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(seconds: 1));
    isLoading = false;

    if (email == 'error@teste.com') {
      errorMessage = 'Aguarde antes de tentar novamente.';
      startCooldown();
      notifyListeners();
      return;
    }
    nextStep();
  }

  Future<void> verifyCode() async {
    if (code.length < 6) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(seconds: 1));
    isLoading = false;

    if (code == '000000') {
      errorMessage = 'Código inválido. Solicite um novo.';
      notifyListeners();
      return;
    }
    nextStep();
  }

  Future<bool> resetPassword() async {
    if (!isPasswordValid || !passwordsMatch) return false;
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(seconds: 1));
    isLoading = false;
    notifyListeners();

    return true;
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }
}

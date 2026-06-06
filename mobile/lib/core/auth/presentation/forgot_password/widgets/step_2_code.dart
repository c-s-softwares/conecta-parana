import 'package:flutter/material.dart';
import '../forgot_password_controller.dart';

class Step2Code extends StatefulWidget {
  final ForgotPasswordController controller;

  const Step2Code({super.key, required this.controller});

  @override
  State<Step2Code> createState() => _Step2CodeState();
}

class _Step2CodeState extends State<Step2Code> {
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );

  @override
  void dispose() {
    for (var node in _focusNodes) {
      node.dispose();
    }
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onChanged(String value, int index) {
    if (value.length > 1) {
      final chars = value.split('');

      for (int i = 0; i < chars.length && i < 6; i++) {
        _controllers[i].text = chars[i];
      }

      widget.controller.code = _controllers.map((c) => c.text).join();

      setState(() {});
      return;
    }
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    widget.controller.code = _controllers.map((c) => c.text).join();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.mark_email_read_outlined, size: 64),
          const SizedBox(height: 16),
          const Text('Enviamos um código para', textAlign: TextAlign.center),
          Text(
            widget.controller.email,
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 32),
          const Text('CÓDIGO DE 6 DÍGITOS', textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(6, (index) {
              return SizedBox(
                width: 45,
                child: TextField(
                  controller: _controllers[index],
                  focusNode: _focusNodes[index],
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  maxLength: 1,
                  decoration: const InputDecoration(counterText: ''),
                  onChanged: (val) => _onChanged(val, index),
                ),
              );
            }),
          ),
          if (widget.controller.errorMessage != null) ...[
            const SizedBox(height: 16),
            Text(
              widget.controller.errorMessage!,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ],
          const Spacer(),
          ElevatedButton(
            onPressed:
                widget.controller.code.length == 6 &&
                    !widget.controller.isLoading
                ? () => widget.controller.verifyCode()
                : null,
            child: widget.controller.isLoading
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('Verificar código'),
          ),
          TextButton(
            onPressed: widget.controller.resendCooldown > 0
                ? null
                : () async {
                    await widget.controller.submitEmail();
                  },
            child: Text(
              widget.controller.resendCooldown > 0
                  ? 'Aguarde ${widget.controller.resendCooldown}s'
                  : 'Não recebeu? Reenviar código',
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/remote_suggestion_repository.dart';
import '../../domain/repositories/suggestion_repository.dart';

class NewSuggestionPage extends StatefulWidget {
  final SuggestionRepository? repository;

  const NewSuggestionPage({super.key, this.repository});

  @override
  State<NewSuggestionPage> createState() => _NewSuggestionPageState();
}

class _NewSuggestionPageState extends State<NewSuggestionPage> {
  static const int _subjectMaxLength = 200;
  static const int _messageMaxLength = 1000;

  static const List<String> _categories = [
    'Mobilidade urbana',
    'Meio ambiente',
    'Transporte',
    'Iluminação',
    'Limpeza urbana',
    'Lazer',
    'Outros',
  ];

  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  late final SuggestionRepository _repository;
  String _selectedCategory = _categories.first;
  String? _subjectBackendError;
  String? _messageBackendError;
  bool _isSubmitting = false;
  bool _hasTriedSubmit = false;
  bool _subjectTouched = false;
  bool _messageTouched = false;

  bool get _isSubjectValid {
    final text = _subjectController.text;
    return text.trim().isNotEmpty && text.length <= _subjectMaxLength;
  }

  bool get _isMessageValid {
    final text = _messageController.text;
    return text.trim().isNotEmpty && text.length <= _messageMaxLength;
  }

  bool get _canSubmit {
    return _isSubjectValid && _isMessageValid && !_isSubmitting;
  }

  int get _messageLength => _messageController.text.length;

  bool get _isMessageOverLimit => _messageLength > _messageMaxLength;

  int get _remainingCharacters => _messageMaxLength - _messageLength;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? RemoteSuggestionRepository();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    setState(() {
      _hasTriedSubmit = true;
      _subjectBackendError = null;
      _messageBackendError = null;
    });

    final isFormValid = _formKey.currentState?.validate() ?? false;

    if (!isFormValid || !_canSubmit) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _repository.createSuggestion(
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
        category: _selectedCategory,
      );

      if (!mounted) return;

      Navigator.of(context).pop(true);
    } on SuggestionUserWithoutCityException {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Selecione sua cidade na Home antes de enviar.'),
        ),
      );
    } on SuggestionSubjectTooLongException {
      if (!mounted) return;

      setState(() {
        _subjectBackendError =
            'Assunto muito longo. Reduza para até 200 caracteres.';
      });

      _formKey.currentState?.validate();
    } on SuggestionMessageTooLongException {
      if (!mounted) return;

      setState(() {
        _messageBackendError =
            'Mensagem muito longa. Reduza para até 1000 caracteres.';
      });

      _formKey.currentState?.validate();
    } on SuggestionNetworkException {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Não foi possível enviar a sugestão. Tente novamente.'),
        ),
      );
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Não foi possível enviar a sugestão. Tente novamente.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final backgroundColor = isDark
        ? const Color(0xFF00140B)
        : const Color(0xFFF7F9FA);

    final titleColor = isDark
        ? const Color(0xFFF3E8FF)
        : const Color(0xFF071A12);

    final labelColor = isDark
        ? const Color(0xFFADB8B1)
        : const Color(0xFF4C5651);

    final inputFillColor = isDark
        ? const Color(0xFF071C13)
        : const Color(0xFFEFF3F5);

    final inputBorderColor = isDark
        ? const Color(0xFF234534)
        : const Color(0xFFD8DFDD);

    final primaryColor = isDark
        ? const Color(0xFF55B178)
        : const Color(0xFF007A3D);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.disabled,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _BackButtonCircle(isDark: isDark),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'IDEIA PARA A PREFEITURA',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Nova Sugestão',
                            style: TextStyle(
                              color: titleColor,
                              fontSize: 28,
                              height: 1,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                _InfoBox(isDark: isDark),
                const SizedBox(height: 20),

                _FieldLabel(text: 'ASSUNTO', color: labelColor),
                const SizedBox(height: 8),
                TextFormField(
                  key: const Key('new_suggestion_subject_field'),
                  controller: _subjectController,
                  enabled: !_isSubmitting,
                  maxLength: _subjectMaxLength + 1,
                  buildCounter:
                      (
                        context, {
                        required currentLength,
                        required isFocused,
                        maxLength,
                      }) {
                        return const SizedBox.shrink();
                      },
                  decoration: _inputDecoration(
                    fillColor: inputFillColor,
                    borderColor: inputBorderColor,
                    hintText: 'Ciclovia na Av. Brasil',
                  ),
                  validator: (value) {
                    final text = value ?? '';

                    if (_subjectBackendError != null) {
                      return _subjectBackendError;
                    }

                    if (!_hasTriedSubmit && !_subjectTouched) {
                      return null;
                    }

                    if (text.trim().isEmpty) {
                      return 'Informe o assunto.';
                    }

                    if (text.length > _subjectMaxLength) {
                      return 'Assunto deve ter no máximo 200 caracteres.';
                    }

                    return null;
                  },
                  onChanged: (_) {
                    setState(() {
                      _subjectTouched = true;

                      if (_subjectBackendError != null) {
                        _subjectBackendError = null;
                      }
                    });

                    _formKey.currentState?.validate();
                  },
                ),
                const SizedBox(height: 18),

                _FieldLabel(text: 'CATEGORIA', color: labelColor),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  key: const Key('new_suggestion_category_field'),
                  initialValue: _selectedCategory,
                  isExpanded: true,
                  dropdownColor: isDark
                      ? const Color(0xFF071C13)
                      : Colors.white,
                  decoration: _inputDecoration(
                    fillColor: inputFillColor,
                    borderColor: inputBorderColor,
                  ),
                  items: _categories.map((category) {
                    return DropdownMenuItem<String>(
                      value: category,
                      child: Text(category),
                    );
                  }).toList(),
                  onChanged: _isSubmitting
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            _selectedCategory = value;
                          });
                        },
                ),
                const SizedBox(height: 18),

                Row(
                  children: [
                    Expanded(
                      child: _FieldLabel(text: 'MENSAGEM', color: labelColor),
                    ),
                    Text(
                      '$_messageLength / $_messageMaxLength',
                      key: const Key('new_suggestion_message_counter'),
                      style: TextStyle(
                        color: _isMessageOverLimit ? Colors.red : labelColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextFormField(
                  key: const Key('new_suggestion_message_field'),
                  controller: _messageController,
                  enabled: !_isSubmitting,
                  minLines: 6,
                  maxLines: 8,
                  keyboardType: TextInputType.multiline,
                  decoration: _inputDecoration(
                    fillColor: inputFillColor,
                    borderColor: _isMessageOverLimit
                        ? Colors.red
                        : primaryColor,
                    hintText: 'Descreva sua sugestão para a prefeitura...',
                  ),
                  validator: (value) {
                    final text = value ?? '';

                    if (_messageBackendError != null) {
                      return _messageBackendError;
                    }

                    if (!_hasTriedSubmit && !_messageTouched) {
                      return null;
                    }

                    if (text.trim().isEmpty) {
                      return 'Informe a mensagem.';
                    }

                    if (text.length > _messageMaxLength) {
                      return 'Mensagem deve ter no máximo 1000 caracteres.';
                    }

                    return null;
                  },
                  onChanged: (_) {
                    setState(() {
                      _messageTouched = true;

                      if (_messageBackendError != null) {
                        _messageBackendError = null;
                      }
                    });

                    _formKey.currentState?.validate();
                  },
                ),
                const SizedBox(height: 6),

                _MessageProgress(
                  currentLength: _messageLength,
                  maxLength: _messageMaxLength,
                  isOverLimit: _isMessageOverLimit,
                  remainingCharacters: _remainingCharacters,
                  primaryColor: primaryColor,
                  labelColor: labelColor,
                  isDark: isDark,
                ),
                const SizedBox(height: 28),

                SizedBox(
                  height: 56,
                  child: ElevatedButton.icon(
                    key: const Key('new_suggestion_submit_button'),
                    onPressed: _canSubmit ? _submit : null,
                    icon: _isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.share_outlined),
                    label: Text(
                      _isSubmitting ? 'Enviando...' : 'Enviar sugestão',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF007A3D),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: isDark
                          ? const Color(0xFF55B178).withValues(alpha: 0.45)
                          : const Color(0xFF007A3D).withValues(alpha: 0.35),
                      disabledForegroundColor: Colors.white.withValues(
                        alpha: 0.8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required Color fillColor,
    required Color borderColor,
    String? hintText,
  }) {
    return InputDecoration(
      filled: true,
      fillColor: fillColor,
      hintText: hintText,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: borderColor, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.red),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.red, width: 1.4),
      ),
    );
  }
}

class _BackButtonCircle extends StatelessWidget {
  final bool isDark;

  const _BackButtonCircle({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: () {
        Navigator.of(context).maybePop();
      },
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF142318) : const Color(0xFFE9EEF0),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.chevron_left),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final bool isDark;

  const _InfoBox({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final borderColor = isDark
        ? const Color(0xFF7A5C16)
        : const Color(0xFFE7C981);

    final backgroundColor = isDark
        ? const Color(0xFF172214)
        : const Color(0xFFF6F0DF);

    final textColor = isDark
        ? const Color(0xFFEDE7D5)
        : const Color(0xFF111A15);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: RichText(
        text: TextSpan(
          style: TextStyle(color: textColor, fontSize: 15, height: 1.35),
          children: [
            const TextSpan(
              text: 'Sugestão',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            const TextSpan(
              text:
                  ' = ideia ou melhoria para a cidade. Para problemas urgentes, use ',
            ),
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: GestureDetector(
                onTap: () {
                  context.go('/tickets');
                },
                child: const Text(
                  'Tickets.',
                  style: TextStyle(
                    color: Color(0xFF007A3D),
                    fontSize: 15,
                    height: 1.35,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  final Color color;

  const _FieldLabel({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        color: color,
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.4,
      ),
    );
  }
}

class _MessageProgress extends StatelessWidget {
  final int currentLength;
  final int maxLength;
  final bool isOverLimit;
  final int remainingCharacters;
  final Color primaryColor;
  final Color labelColor;
  final bool isDark;

  const _MessageProgress({
    required this.currentLength,
    required this.maxLength,
    required this.isOverLimit,
    required this.remainingCharacters,
    required this.primaryColor,
    required this.labelColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final progress = (currentLength / maxLength).clamp(0.0, 1.0);

    final progressColor = isOverLimit ? Colors.red : primaryColor;

    final backgroundColor = isDark
        ? const Color(0xFF173324)
        : const Color(0xFFDDE5E2);

    final text = isOverLimit
        ? '${remainingCharacters.abs()} caracteres acima do limite'
        : '$remainingCharacters caracteres restantes';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 4,
            backgroundColor: backgroundColor,
            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          text,
          style: TextStyle(
            color: isOverLimit ? Colors.red : labelColor,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

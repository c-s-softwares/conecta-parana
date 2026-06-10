import 'package:flutter/material.dart';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:conectaparana/features/register/data/models/services/register_repository.dart';
import 'package:conectaparana/core/auth/auth_service.dart';
import 'package:conectaparana/core/auth/auth_user.dart';
import 'package:conectaparana/core/auth/auth_event.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:conectaparana/core/auth/presentation/register_screen.dart';
import 'package:conectaparana/features/register/data/models/services/city_service.dart';
import 'package:conectaparana/features/register/data/models/services/city_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FakeCityService extends CityService {
  @override
  Future<List<City>> getCities() async {
    return [
      const City(id: '1', name: 'Curitiba'),
      const City(id: '2', name: 'Maringá'),
    ];
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });
  Widget buildApp() {
    return MaterialApp(
      home: RegisterScreen(cityService: FakeCityService()),
      routes: {
        '/styleguide': (_) => const Scaffold(body: Text('Styleguide')),
        '/login': (_) => const Scaffold(body: Text('Login')),
      },
    );
  }

  Future<void> pumpReady(WidgetTester tester) async {
    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();
  }

  Future<void> scrollAndTap(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  Future<void> preencherFormValido(WidgetTester tester) async {
    await tester.enterText(find.byType(TextFormField).at(0), 'Nome Sobrenome');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'camila@email.com',
    );
    await tester.enterText(find.byType(TextFormField).at(2), 'Senha@123');
    await tester.enterText(find.byType(TextFormField).at(3), 'Senha@123');
    await tester.pumpAndSettle();

    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pumpAndSettle();

    await scrollAndTap(tester, find.byType(DropdownButtonFormField<City>));
    await tester.tap(find.text('Curitiba').last);
    await tester.pumpAndSettle();

    await scrollAndTap(tester, find.byKey(const Key('terms_checkbox')));
  }

  group('RegisterScreen — validação', () {
    testWidgets('botão Criar conta desabilitado com form vazio', (
      tester,
    ) async {
      await pumpReady(tester);

      final botao = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Criar conta'),
      );
      expect(botao.onPressed, isNull);
    });

    testWidgets('erro inline quando email inválido', (tester) async {
      await pumpReady(tester);

      await tester.enterText(find.byType(TextFormField).at(1), 'emailinvalido');
      await tester.pumpAndSettle();

      expect(find.text('Informe um email válido'), findsOneWidget);
    });

    testWidgets('erro inline quando senha fraca', (tester) async {
      await pumpReady(tester);

      await tester.enterText(find.byType(TextFormField).at(2), '1234');
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Mín. 8 caracteres com maiúscula, minúscula, número e especial',
        ),
        findsOneWidget,
      );
    });

    testWidgets('erro quando senhas não coincidem', (tester) async {
      await pumpReady(tester);

      await tester.enterText(find.byType(TextFormField).at(2), 'Senha@123');
      await tester.enterText(find.byType(TextFormField).at(3), 'Senha@456');
      await tester.pumpAndSettle();

      expect(find.text('As senhas não coincidem'), findsOneWidget);
    });

    testWidgets('dropdown mostra cidades carregadas', (tester) async {
      await pumpReady(tester);

      final dropdown = find.byType(DropdownButtonFormField<City>);
      await tester.ensureVisible(dropdown);
      await tester.tap(dropdown);
      await tester.pumpAndSettle();

      expect(find.text('Curitiba'), findsWidgets);
      expect(find.text('Maringá'), findsWidgets);
    });

    testWidgets('dropdown mostra erro quando getCities lança exceção', (
      tester,
    ) async {
      final errorService = _ErrorCityService();
      await tester.pumpWidget(
        MaterialApp(home: RegisterScreen(cityService: errorService)),
      );
      await tester.pumpAndSettle();

      expect(find.text('Erro ao carregar cidades.'), findsOneWidget);
      expect(find.text('Tentar novamente'), findsOneWidget);
    });

    testWidgets('campos ficam desabilitados quando cities falha', (
      tester,
    ) async {
      final errorService = _ErrorCityService();
      await tester.pumpWidget(
        MaterialApp(home: RegisterScreen(cityService: errorService)),
      );
      await tester.pumpAndSettle();

      final campos = tester
          .widgetList<TextFormField>(find.byType(TextFormField))
          .toList();

      expect(campos.length, 4);
      for (final campo in campos) {
        expect(
          campo.enabled,
          isFalse,
          reason:
              'Campo deveria estar desabilitado enquanto cities está em erro',
        );
      }
    });

    testWidgets(
      'erro inline + botão Fazer login quando backend retorna email_exists (409)',
      (tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: RegisterScreen(
              cityService: FakeCityService(),
              repository: _EmailExistsRepository(),
            ),
            routes: {
              '/onboarding': (_) => const Scaffold(body: Text('Onboarding')),
              '/login': (_) => const Scaffold(body: Text('Login')),
            },
          ),
        );
        await tester.pumpAndSettle();

        await preencherFormValido(tester);

        final submitBtn = tester.widget<ElevatedButton>(
          find.byKey(const Key('register_submit_button')),
        );
        expect(submitBtn.onPressed, isNotNull);

        await scrollAndTap(
          tester,
          find.byKey(const Key('register_submit_button')),
        );

        expect(
          find.text('Esse email já tem conta. Faça login.'),
          findsOneWidget,
        );
        expect(find.byKey(const Key('go_to_login_button')), findsOneWidget);
        expect(find.text('Onboarding'), findsNothing);

        await scrollAndTap(tester, find.byKey(const Key('go_to_login_button')));
        expect(find.text('Login'), findsOneWidget);
      },
    );
    testWidgets('happy path: cadastra com sucesso e navega para /onboarding', (
      tester,
    ) async {
      final fakeAuth = _FakeAuthService();
      AuthService.overrideInstance(fakeAuth);
      addTearDown(AuthService.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: RegisterScreen(
            cityService: FakeCityService(),
            repository: _HappyRepository(),
          ),
          routes: {
            '/onboarding': (_) => const Scaffold(body: Text('Onboarding')),
            '/login': (_) => const Scaffold(body: Text('Login')),
          },
        ),
      );
      await tester.pumpAndSettle();

      await preencherFormValido(tester);

      final submitBtn = tester.widget<ElevatedButton>(
        find.byKey(const Key('register_submit_button')),
      );
      expect(
        submitBtn.onPressed,
        isNotNull,
        reason: 'O botão de cadastrar está desabilitado!',
      );

      await scrollAndTap(
        tester,
        find.byKey(const Key('register_submit_button')),
      );

      expect(fakeAuth.loginCalled, isTrue);
      expect(fakeAuth.lastAccessToken, 'fake-access-token');
      expect(fakeAuth.lastRefreshToken, 'fake-refresh-token');
      expect(find.text('Styleguide'), findsOneWidget);
    });
  });
}

class _ErrorCityService extends CityService {
  @override
  Future<List<City>> getCities() async {
    throw Exception('falha de rede');
  }
}

class _EmailExistsRepository extends RegisterRepository {
  @override
  Future<({String accessToken, String refreshToken})> register({
    required String name,
    required String email,
    required String password,
    required String cityId,
  }) async {
    throw DioException(
      requestOptions: RequestOptions(path: '/auth/register'),
      response: Response(
        requestOptions: RequestOptions(path: '/auth/register'),
        statusCode: 409,
        data: {'code': 'email_exists'},
      ),
    );
  }
}

class _HappyRepository extends RegisterRepository {
  @override
  Future<({String accessToken, String refreshToken})> register({
    required String name,
    required String email,
    required String password,
    required String cityId,
  }) async {
    return (
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token',
    );
  }
}

class _FakeAuthService implements AuthService {
  @override
  final ValueNotifier<AuthUser?> currentUser = ValueNotifier(null);

  final _events = StreamController<AuthEvent>.broadcast();
  @override
  Stream<AuthEvent> get events => _events.stream;

  bool loginCalled = false;
  String? lastAccessToken;
  String? lastRefreshToken;

  @override
  Future<void> login({
    required String accessToken,
    required String refreshToken,
  }) async {
    loginCalled = true;
    lastAccessToken = accessToken;
    lastRefreshToken = refreshToken;
    currentUser.value = AuthUser(id: 'user-1', role: 'USER', cityId: '1');
  }

  @override
  Future<void> init() async {}

  @override
  Future<void> logout({bool expired = false}) async {}

  @override
  Future<void> refresh() async {}

  @override
  Future<void> register() async {}

  @override
  Future<void> logoutAll() async {}

  @override
  Future<String?> getAccessToken() async => lastAccessToken;

  @override
  Future<String?> getRefreshToken() async => lastRefreshToken;

  @override
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    lastAccessToken = accessToken;
    lastRefreshToken = refreshToken;
  }
}
